# Chat UI Components

assistant-ui React components for the conversation interface. All user-facing text is Hebrew.

## Files

- `thread.tsx` — Main conversation UI: messages, composer, welcome state, branch picker, action bars (390 lines, largest component)
- `thread-list.tsx` — Sidebar thread list with new/archive actions
- `threadlist-sidebar.tsx` — Wrapper placing ThreadList inside a Sidebar (right-positioned for RTL)
- `markdown-text.tsx` — Markdown renderer with syntax highlighting, uses `unstable_memoizeMarkdownComponents`
- `attachment.tsx` — File/image attachment handling for composer and messages (File objects + data URLs)
- `tool-fallback.tsx` — Generic collapsible display for tool calls without custom UI
- `tooltip-icon-button.tsx` — Reusable icon button with Radix tooltip, used across all components

## Conventions

- **Primitives from `@assistant-ui/react`**: ThreadPrimitive, MessagePrimitive, ComposerPrimitive — compose, don't rewrite
- **CSS prefix**: All components use `aui-*` class names for styling/querying
- **Animations**: `motion/react` with `LazyMotion` + `domAnimation` in thread.tsx
- **Layout**: Thread max-width `44rem` via CSS variable `--thread-max-width`; user messages use CSS Grid
- **RTL**: Sidebar positioned "right"; uses `ms`/`pe` utility classes instead of `ml`/`pr`
- **Container queries**: `@container` / `@md` for responsive layouts within components

## Gotchas

- `markdown-text.tsx` uses `unstable_memoizeMarkdownComponents` — API may change in future assistant-ui versions
- Thread welcome suggestions have `autoSend` property — some auto-send on click, others require manual send
- `useShallow` from zustand used for memoized state selection in attachment components
