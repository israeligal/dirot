---
name: chat-conversation
description: Chat conversation flow from UI to agent execution. Covers the API route (POST stream, GET history), Mastra agent configuration (model, tools, memory), assistant-ui runtime setup, and message streaming. Use when working on chat endpoints, agent behavior, message persistence, tool registration, or the assistant UI runtime.
---

# Chat Conversation

End-to-end chat flow: user message → API route → Mastra agent → tool execution → streamed response → UI rendering.

## File Map

| Layer | Path | Purpose |
|-------|------|---------|
| API Route | `app/api/chat/route.ts` | POST (stream chat) + GET (history recall) |
| Agent | `mastra/agents/dirot-agent.ts` | Agent definition: model, tools, memory, system prompt |
| Framework | `mastra/index.ts` | Mastra instance: PostgresStore, Observability |
| UI Runtime | `app/assistant.tsx` | Client component: chat runtime, tool UIs, session |
| UI Components | `components/assistant-ui/` | Thread, composer, markdown, attachments |

## Request Flow

```
User types message in Composer (thread.tsx)
  → AssistantChatTransport sends POST /api/chat
  → route.ts authenticates via getSession()
  → Derives threadId: "dirot-{userId}", resourceId: userId
  → handleChatStream() invokes dirotAgent with maxSteps: 10
  → Agent selects tools, executes queries/scoring
  → HITL tools suspend execution, wait for UI addResult()
  → Response streamed via createUIMessageStreamResponse()
  → Thread renders markdown + tool results
  → If all tool calls complete, auto-send triggers next loop
```

## Key Patterns

- **Thread ID**: `"dirot-{userId}"` — one persistent thread per user, scoped by `resourceId`
- **Memory window**: Last 40 messages retained; oldest dropped to prevent context bloat
- **Auto-send**: `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` enables multi-step tool loops without user clicking send
- **maxSteps: 10**: Limits tool-calling loops per single user message
- **Message format conversion**: Mastra uses AI SDK v6 internally, converts to v5 for frontend via `toAISdkV5Messages()`
- **maxDuration: 30**: API route timeout set at module level

## External Dependencies

- `@mastra/ai-sdk` — `handleChatStream()`, `toAISdkV5Messages()`
- `ai` (Vercel AI SDK) — `createUIMessageStreamResponse()`
- `@ai-sdk/google` — Google Generative AI provider
- `@assistant-ui/react` — UI runtime, primitives
- `@assistant-ui/react-ai-sdk` — `useChatRuntime`, `AssistantChatTransport`

## Data Model

- **Thread**: Persisted in `mastra_threads` table via PostgresStore
- **Messages**: Stored in `mastra_messages` with role, content array (text + tool-call + tool-result parts)
- **Spans**: Observability traces in `mastra_ai_spans` — see `.claude/skills/traces/`

## Agent Configuration

- **Model**: `AI_MODEL` env var (default `google/gemini-2.5-pro`), `GOOGLE_API_KEY` for auth
- **Tools**: 12 data query tools + scoring + 3 HITL tools — all always available
- **System prompt**: ~1000 lines defining investment analyst persona, workflows, scoring interpretation, anomaly detection
- **Language**: Matches user language (Hebrew or English), includes Hebrew field names with explanations

## Gotchas

- GET /api/chat silently catches recall errors (logs "No previous messages found" to console)
- Agent model initialization only supports Google provider currently; throws on unsupported provider prefix
- Session is required — no fallback UI if unauthenticated (proxy.ts handles redirect)
- Memory refresh on page load hits GET endpoint; no client-side caching of conversation history
