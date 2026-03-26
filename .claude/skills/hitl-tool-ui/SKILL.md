---
name: hitl-tool-ui
description: Human-in-the-loop (HITL) tool UI patterns using makeAssistantToolUI from assistant-ui. Covers todo/task list management, plan approval workflows, user input requests, and email approval. Use when creating new HITL tools, adding tool UI components, working with addResult(), tool status state machine, or the todo state system.
---

# HITL Tool UI

Interactive tool UIs that suspend agent execution and wait for user action (approve, reject, edit, input). Built with `makeAssistantToolUI` from `@assistant-ui/react`.

## File Map

| Layer | Path | Purpose |
|-------|------|---------|
| Tool Definition | `mastra/tools/update-todos-tool.ts` | Stateful task list (has execute fn) |
| Tool Definition | `mastra/tools/ask-for-plan-approval-tool.ts` | Plan approval schema (no execute fn) |
| Tool Definition | `mastra/tools/request-input.ts` | User input request schema (no execute fn) |
| Tool UI | `components/tools/todo.tsx` | Todo list display with auto-expand |
| Tool UI | `components/tools/plan-approval.tsx` | Editable todo list + approve/reject |
| Tool UI | `components/tools/human-in-the-loop.tsx` | Email approval + input request UIs |
| Tool UI | `components/tools/automation.tsx` | Firecrawl display + email sending |
| Hook | `hooks/use-latest-todos.ts` | Extract latest todos from thread history |
| Registration | `app/assistant.tsx` | Tool UIs mounted alongside Thread component |

## Key Patterns

- **makeAssistantToolUI\<Args, Result\>**: Creates a React component bound to a tool by `toolName`. Render receives `{ args, result, status, addResult }`
- **No execute function**: `askForPlanApprovalTool` and `requestInputTool` define only schemas — Mastra framework intercepts, UI calls `addResult()` to complete
- **Stateful todos**: `updateTodosTool` has an execute fn that traverses `context.agent.messages` in reverse to find previous todo state, then applies mutations
- **Status state machine**: `status.type` flows `"running"` → `"complete"` (approved/submitted) or `"incomplete"` (rejected/error)

## Todo State Flow

```
Agent calls updateTodosTool({ new: ["Task"], inProgress: [0], done: [2] })
  → execute() searches message history for previous todos
  → Auto-transitions "new" items → "pending"
  → Applies mutations: add new, mark in-progress/done, filter cleared
  → Returns { todos: Todo[] }
  → UpdateTodosToolUI renders with auto-expand if most recent

Agent calls askForPlanApprovalTool({ explainer: "..." })
  → No execute — UI renders immediately
  → useLatestTodos() pre-populates from thread history
  → User edits todos, clicks Approve/Reject
  → addResult({ todos, approved: true/false })
  → Agent receives result, continues or adjusts
```

## Data Model

```typescript
type Todo = { text: string; status: "new" | "pending" | "in-progress" | "done" }
```

- Tool name strings: `"updateTodosTool"`, `"ask-for-plan-approval"` (note: no "Tool" suffix on approval)
- `useLatestTodos()` searches for both tool names when extracting state

## External Dependencies

- `@assistant-ui/react` — `makeAssistantToolUI`, `useAssistantState`
- `lucide-react` — Status icons (Circle, Clock, CheckCircle2, Sparkles, Trash2)

## Gotchas

- Tool name mismatch: Mastra tool id is `"ask-for-plan-approval"` (no "Tool" suffix) — `useLatestTodos()` searches this string
- Plan approval auto-filters "done" tasks on initial render — users may be surprised tasks disappeared
- `updateTodosTool` searches full message history each execution — performance cost scales with conversation length
- Focus management in plan-approval uses imperative `itemRefs` — must stay in sync with todos array length
- All HITL components have hardcoded Hebrew strings (not i18n-ready)
- Each tool UI must be explicitly mounted in `app/assistant.tsx` — missing registration means tool falls back to generic JSON display
