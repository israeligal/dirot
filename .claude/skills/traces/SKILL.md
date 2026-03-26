---
name: traces
description: Debug Mastra agent conversations by querying the PostgreSQL observability database via Neon MCP. Use when the user says "/traces", "show traces", "debug conversation", "what happened in the chat", "show me the agent logs", "tool inputs/outputs", "why did the agent do X", "trace errors", "agent performance", "show memory", "show messages", "show threads", or anything related to inspecting past AI agent executions, tool calls, memory state, thread history, or debugging agent behavior. Also use when investigating unexpected agent responses or slow performance.
---

# Dirot Trace Debugger

Debug agent conversations by querying Mastra's PostgreSQL tables (Neon) — spans, messages, and threads.

## Database Access

Use the `mcp__neon-slim__sql` tool for all queries. Each call accepts a single SQL statement.

**Tables used:**

| Table | Purpose |
|-------|---------|
| `mastra_ai_spans` | Execution traces (agents, tools, models) |
| `mastra_messages` | Persisted chat messages per thread |
| `mastra_threads` | Thread metadata (title, resourceId, status) |

### Table: `mastra_ai_spans`

**Core columns:**

| Column | Type | Notes |
|--------|------|-------|
| `traceId` | text | Groups all spans from one conversation turn |
| `spanId` | text | Unique span identifier |
| `parentSpanId` | text | Parent span (builds execution tree) |
| `name` | text | Agent name, tool name, or model identifier |
| `spanType` | text | `agent_run`, `tool_call`, `model_generation`, `model_step`, `model_chunk` |
| `entityType` | text | `agent` or `tool` |
| `entityName` | text | Human-readable: "Dirot Investment Analyst", "searchPinuiBinui", etc. |
| `isEvent` | boolean | `FALSE` = span (has duration), `TRUE` = point-in-time event |
| `runId` | text | Unique per agent execution |
| `startedAt` | timestamp | UTC timestamp |
| `endedAt` | timestamp | UTC timestamp |

**Context columns:**

| Column | Type | Notes |
|--------|------|-------|
| `threadId` | text | Chat thread ID (format: `dirot-{userId}`) |
| `requestContext` | jsonb | Full requestContext passed to the agent |

**JSONB columns** (native JSONB -- access via `->` / `->>` operators):

| Column | Content |
|--------|---------|
| `input` | Tool parameters, LLM messages, agent instructions |
| `output` | Tool results, LLM responses |
| `attributes` | Model name/provider/params for `model_generation`; tool metadata for `tool_call` |
| `metadata` | `runId` reference and custom metadata |
| `error` | Error details -- NULL when no error |

**JSONB access syntax:**
```sql
-- Extract text value:  column->>'key'
-- Extract nested:      column->'nested'->>'key'
-- DO NOT use json() or json_extract() -- those are SQLite-only
```

**Serialization caveat:** Mastra's exporter truncates strings at 1024 chars, nests at depth 6, arrays at 50 items by default. If tool I/O looks cut off, it was truncated at write time, not by the query.

## Invocation Modes

Parse the user's `/traces` argument to determine which mode to run:

| Argument | Mode | What to do |
|----------|------|------------|
| *(none)* | Overview | Show last 10 traces with agent names, duration, span count, error flag |
| `latest` | Deep-dive | Full deep-dive on the most recent trace |
| `<time>` (e.g. "5min ago", "14:30") | Time search | Find traces near that time, then overview |
| `<traceId>` (hex string) | Deep-dive | Full deep-dive on that specific trace |
| `errors` | Error report | All error spans across all traces |
| `perf` | Performance | Tool and agent duration statistics |
| `tools` | Tool summary | Tool usage frequency across all traces |
| `tools <traceId>` | Tool drill-down | Every tool call in that trace with full untruncated I/O |
| `messages` | Messages | Show persisted messages for the default thread |
| `messages <threadId>` | Messages | Show persisted messages for a specific thread |
| `threads` | Threads | List threads with title, message count, last activity |

## Mode: Overview

Show a timeline of recent conversations:

```sql
SELECT "traceId",
  MIN("startedAt") as started,
  COUNT(*) as spans,
  SUM(CASE WHEN "spanType" = 'tool_call' THEN 1 ELSE 0 END) as tool_calls,
  SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors,
  ROUND(EXTRACT(EPOCH FROM (MAX("endedAt") - MIN("startedAt")))::numeric, 1) as dur_sec,
  STRING_AGG(DISTINCT CASE WHEN "entityType" = 'agent' THEN "entityName" END, ', ') as agents,
  MIN("threadId") as thread_id
FROM mastra_ai_spans
GROUP BY "traceId"
ORDER BY started DESC
LIMIT 10
```

Present as a table. Flag traces with errors. If the user wants to dig into one, switch to deep-dive mode.

## Mode: Deep-Dive

For a specific trace, run these steps in order:

### Step 1: Execution Flow Tree

```sql
SELECT "spanId", "parentSpanId", name, "spanType",
  ROUND(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))::numeric, 2) as dur_sec
FROM mastra_ai_spans
WHERE "traceId" = '{TRACE_ID}'
  AND "spanType" IN ('agent_run', 'tool_call', 'model_generation')
ORDER BY "startedAt" ASC
```

Render as an indented tree using `parentSpanId` relationships:
```
dirot-agent (agent_run, 12.3s)
  model_generation (google/gemini-2.5-pro, 2.1s)
  searchPinuiBinui (tool_call, 1.5s)
  searchInfrastructure (tool_call, 0.8s)
  scoreProject (tool_call, 3.2s)
  model_generation (google/gemini-2.5-pro, 4.1s)
```

### Step 2: Tool Summary with I/O Preview

```sql
SELECT name,
  ROUND(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))::numeric, 2) as dur_sec,
  LEFT(input::text, 200) as input_preview,
  LEFT(output::text, 200) as output_preview,
  CASE WHEN error IS NOT NULL THEN 'ERROR' ELSE 'OK' END as status
FROM mastra_ai_spans
WHERE "traceId" = '{TRACE_ID}' AND "spanType" = 'tool_call'
ORDER BY "startedAt" ASC
```

### Step 3: Full Untruncated Tool I/O

This is the most important step -- the user's primary debugging need:

```sql
SELECT name, input, output
FROM mastra_ai_spans
WHERE "traceId" = '{TRACE_ID}' AND "spanType" = 'tool_call'
ORDER BY "startedAt" ASC
```

Present each tool call clearly:
```
--- searchPinuiBinui ---
INPUT:  { ...full JSON... }
OUTPUT: { ...full JSON... }

--- scoreProject ---
INPUT:  { ...full JSON... }
OUTPUT: { ...full JSON... }
```

If output is very large (>5000 chars), still show it in full but mention the size.

### Step 4: Available vs Used Tools

Cross-reference what tools the agent could have called against what it actually called.

**Dirot agent tool registry** (from source code):

- **dirot-agent**: `searchPinuiBinui`, `searchConstructionSites`, `searchConstructionProgress`, `searchLotteries`, `searchInfrastructure`, `searchContractors`, `searchBrokersAndAppraisers`, `searchPublicHousing`, `searchXplan`, `scoreProject`, `updateTodosTool`, `askForPlanApprovalTool`, `requestInputTool`

Compare against actual calls:

```sql
SELECT DISTINCT name
FROM mastra_ai_spans
WHERE "traceId" = '{TRACE_ID}' AND "spanType" = 'tool_call'
```

Present a checklist showing which tools were available vs actually used.

### Step 5: Anomaly Detection

Auto-flag these patterns:

- **Errors**: Any span with non-null `error`
- **Slow spans**: Tool calls or model generations > 10 seconds
- **HITL suspension**: Look for `askForPlanApprovalTool` or `requestInputTool` tool calls
- **Repeated tool calls**: Same tool called multiple times (may indicate retry loops)
- **XPLAN failures**: `searchXplan` errors (external API dependency)

```sql
SELECT name, "spanType", error,
  ROUND(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))::numeric, 2) as dur_sec
FROM mastra_ai_spans
WHERE "traceId" = '{TRACE_ID}'
  AND (
    error IS NOT NULL
    OR EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) > 10
    OR name IN ('askForPlanApprovalTool', 'requestInputTool')
  )
ORDER BY "startedAt" ASC
```

## Mode: Errors

Show all error spans across all traces:

```sql
SELECT "traceId", name, "spanType", "startedAt",
  LEFT(error::text, 500) as error_preview
FROM mastra_ai_spans
WHERE error IS NOT NULL
ORDER BY "startedAt" DESC
LIMIT 20
```

For each error, offer to deep-dive into its trace.

## Mode: Performance

Show tool and agent performance statistics:

```sql
SELECT name, "spanType", COUNT(*) as calls,
  ROUND(AVG(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")))::numeric, 2) as avg_sec,
  ROUND(MIN(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")))::numeric, 2) as min_sec,
  ROUND(MAX(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")))::numeric, 2) as max_sec
FROM mastra_ai_spans
WHERE "spanType" IN ('tool_call', 'agent_run', 'model_generation')
GROUP BY name, "spanType"
ORDER BY avg_sec DESC
```

Flag anything with avg > 10s or high variance (max > 5x avg).

## Mode: Tools

### Global tool usage

```sql
SELECT name, COUNT(*) as total_calls,
  COUNT(DISTINCT "traceId") as traces_used_in,
  ROUND(AVG(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")))::numeric, 2) as avg_sec,
  SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as error_count
FROM mastra_ai_spans
WHERE "spanType" = 'tool_call'
GROUP BY name
ORDER BY total_calls DESC
```

### Per-trace tool drill-down (`/traces tools <traceId>`)

Show every tool call with full untruncated I/O -- same as Deep-Dive Step 3.

## Mode: Messages

Inspect persisted chat messages for a thread.

### List messages (`/traces messages` or `/traces messages <threadId>`)

If no threadId provided, use the pattern `dirot-%` to find threads:

```sql
SELECT id, role, type,
  LEFT(content::text, 300) as content_preview,
  "createdAt"
FROM mastra_messages
WHERE thread_id = '{THREAD_ID}'
ORDER BY "createdAt" ASC
```

### Message stats

```sql
SELECT thread_id,
  COUNT(*) as total_messages,
  SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_msgs,
  SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_msgs,
  SUM(CASE WHEN role = 'tool' THEN 1 ELSE 0 END) as tool_msgs,
  MIN("createdAt") as first_msg,
  MAX("createdAt") as last_msg
FROM mastra_messages
WHERE thread_id LIKE 'dirot-%'
GROUP BY thread_id
```

## Mode: Threads

List and inspect thread metadata:

```sql
SELECT t.id, t.title, t."resourceId",
  t."createdAt", t."updatedAt",
  COUNT(m.id) as message_count,
  MAX(m."createdAt") as last_message_at
FROM mastra_threads t
LEFT JOIN mastra_messages m ON m.thread_id = t.id
GROUP BY t.id, t.title, t."resourceId", t."createdAt", t."updatedAt"
ORDER BY t."updatedAt" DESC
LIMIT 20
```

## Presentation Guidelines

- Use markdown tables for overviews and summaries
- Use code blocks for JSON I/O (preserve readability)
- Bold or flag anomalies inline (errors, slow spans)
- When presenting the flow tree, use indentation to show parent-child relationships
- Always offer to drill deeper: "Want to see full I/O for any of these tools?" or "Want to deep-dive into trace X?"
- For time-based queries, convert relative times ("5min ago") to a WHERE clause like: `"startedAt" > NOW() - INTERVAL '5 minutes'`
