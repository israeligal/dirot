@AGENTS.md

## Essential Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm start        # Start production server
```

## Framework Stack

- **Next.js 16** with React 19, Turbopack, App Router
- **Tailwind CSS v4** - Single CSS import: `@import "tailwindcss"`, CSS variables for theme
- **TypeScript 5** with strict mode

## Tailwind v4 Notes

- Tailwind v4 renames: `rounded-sm` → `rounded-xs`, `shadow-sm` → `shadow-xs`, `blur-sm` → `blur-xs` (scale shifted in v4)
- Use design tokens (`bg-muted`, `text-foreground`, `bg-primary`) over hardcoded colors (`bg-gray-50`, `text-blue-600`)

---

## Clean Code Standards

### Naming Conventions

- `camelCase` for variables, `UPPER_SNAKE_CASE` for module-level constants
- Booleans read as assertions: `isLoaded`, `hasPermission`, `canEdit` — no negated booleans (`isNotDisabled`)
- Collections are plural: `users`, `orderItems`
- Verb-first function names: `fetchUser`, `calculateTotal`, `validateInput`
- `PascalCase` for types, interfaces, classes — no `I` prefix on interfaces
- Avoid generic names: `data`, `info`, `item`, `result`, `value`, `temp`

### Function Design

- Functions do one thing. Target under 20 lines of logic.
- Max 2 levels of indentation — extract deeper logic into named functions
- All exported functions use object destructuring (RORO pattern):

```typescript
// BAD
function fetchUser(id: string) { ... }

// GOOD
function fetchUser({ id }: { id: string }) { ... }
```

- Return objects, not bare primitives or tuples
- Guard clauses and early returns over nested if/else:

```typescript
// BAD
function getDiscount(user) {
  if (user) {
    if (user.isActive) {
      return calculateDiscount(user);
    }
  }
  return 0;
}

// GOOD
function getDiscount(user) {
  if (!user) return 0;
  if (!user.isActive) return 0;
  return calculateDiscount(user);
}
```

### File & Code Structure

- Max ~300 lines per file — longer files signal too many responsibilities
- File order: imports → types → constants → main export(s) → helpers
- Single responsibility per file — if describing it requires "and", split it
- No `utils.ts` / `helpers.ts` grab-bags — group by domain
- Kebab-case directories, PascalCase component files

### Anti-Patterns to Avoid

- **Magic numbers/strings** — extract to named constants
- **Deep nesting** — use early returns, `Array.map`/`filter`, extract functions
- **Commented-out code** — delete it, version control exists
- **Dead code** — remove unused imports, variables, functions
- **Type assertions (`as`)** — prefer type guards or generics
- **`any` type** — use `unknown` and narrow
- **Copy-paste duplication** — 3+ similar blocks → extract shared function
- **Side effects in getters** — `get*`/`calculate*` functions must not mutate state or perform I/O

### TypeScript Patterns

- **Named exports** over default exports
- **No dynamic imports** — always use static imports
- **Modules over classes** — exception: classes for inheritance-based patterns (e.g., repositories)
- **Prefer `const` and `readonly`** — use `let` only when reassignment is necessary
- **React 19 memo()** — extract component first, then wrap: `const C = (props: Props) => {...}; export const Memoized = memo<Props>(C);`
- **No re-exports for backward compatibility** — update all imports to the new location directly

### React & Next.js

- **Mobile first** — all UI starts mobile
- **Minimize `use client`** — prefer React Server Components
- **Derive, don't sync** — derive values from URL/props over syncing to React state
- **Avoid `useState`/`useEffect`** — use server components for data, Server Actions for forms
- **Flexbox** for layouts
- **Feature encapsulation** — separate into: (1) logic module (pure functions, no React), (2) hook (React integration), (3) component (calls the hook)
- **Client-side redirects** — `redirect()` from `next/navigation` during render, `router.push()` only in event handlers. Never `useEffect` for redirect logic.
- **`useSearchParams` requires `Suspense`** — wrap in `Suspense` boundary
- **No parallel state systems** — don't create React Context for state already managed by other libraries (e.g., form state belongs in react-hook-form)
- **No DEV mocks in production** — no hardcoded test data or mock toggles in committed code
- **No prototype pages in PRs** — fine locally, remove before committing

---

## Testing

- **AAA pattern** — Arrange, Act, Assert with blank line separators
- **`it.each()`** for parameterized tests — never copy-paste similar tests
- **Test behavior, not implementation** — verify outputs and side effects, not internal calls
- **Factory helpers** for complex test objects with sensible defaults
- **`beforeEach` not `beforeAll`** for test data — prevents cross-test pollution
- **Test bodies under 20 lines**
- **Always test error paths** — not just happy paths
- **Use `describe` blocks** grouped by module/function, `it('should ... when ...')`

---

## Claude Workflow Rules

- **Never assume** — always find and check function/file names before editing
- **Search first** — always search before creating new files
- **Don't build/run** unless explicitly asked
- **Errors over fallbacks** — when a required value is missing, throw an error. Never silently generate defaults. Defensive fallbacks mask bugs.
- **No backward-compatibility fallbacks** — move forward with clean changes
- **Simple is king** — don't wrap functions unnecessarily
- **Unified patterns** — if you change a pattern, update all similar patterns across the codebase
