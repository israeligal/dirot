# Muted Teal Visual Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a muted teal accent-only color palette (light + dark mode) and add a buildings brand mark SVG to the welcome screen.

**Architecture:** CSS variable value swaps in `globals.css` for the color system, inline SVG addition in `thread.tsx` for the brand mark. All existing components reference design tokens so they pick up the new palette automatically.

**Tech Stack:** Tailwind CSS v4 with OKLCH colors, React/JSX for the SVG component.

**Spec:** `docs/superpowers/specs/2026-03-26-visual-design-design.md`

---

### Task 1: Update light mode CSS variables

**Files:**
- Modify: `app/globals.css:46-78` (`:root` block)

- [ ] **Step 1: Update the light mode primary and accent variables**

In `app/globals.css`, within the `:root` block, replace these variable values:

```css
/* Change these lines in :root { ... } */

/* Line 54 — was: oklch(0.21 0.006 285.885) */
--primary: oklch(0.35 0.08 170);

/* Line 60 — was: oklch(0.967 0.001 286.375) */
--accent: oklch(0.93 0.015 170);

/* Line 61 — was: oklch(0.21 0.006 285.885) */
--accent-foreground: oklch(0.25 0.04 170);

/* Line 65 — was: oklch(0.705 0.015 286.067) */
--ring: oklch(0.50 0.10 170);

/* Line 73 — was: oklch(0.21 0.006 285.885) */
--sidebar-primary: oklch(0.35 0.08 170);

/* Line 75 — was: oklch(0.967 0.001 286.375) */
--sidebar-accent: oklch(0.93 0.015 170);

/* Line 76 — was: oklch(0.21 0.006 285.885) */
--sidebar-accent-foreground: oklch(0.25 0.04 170);
```

Leave all other variables in `:root` unchanged (`--background`, `--foreground`, `--card`, `--secondary`, `--muted`, `--border`, `--input`, `--primary-foreground`, `--sidebar`, `--sidebar-foreground`, `--sidebar-primary-foreground`, `--sidebar-border`, `--sidebar-ring`, `--chart-*`, `--destructive`).

- [ ] **Step 2: Verify the dev server renders light mode with teal accents**

Run: `pnpm dev`

Open `http://localhost:7000` in the browser. Verify:
- The send button in the composer is muted teal (not the old dark gray)
- The sidebar ד icon square is muted teal
- Hovering over suggestion cards shows a faint teal background
- The active thread in the sidebar has a faint teal highlight
- All surfaces (background, sidebar, cards) remain white/light gray — no teal wash

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: apply muted teal accent palette to light mode CSS variables"
```

---

### Task 2: Update dark mode CSS variables

**Files:**
- Modify: `app/globals.css:81-113` (`.dark` block)

- [ ] **Step 1: Update the dark mode primary and ring variables**

In `app/globals.css`, within the `.dark` block, replace these variable values:

```css
/* Change these lines in .dark { ... } */

/* Line 88 — was: oklch(0.92 0.004 286.32) */
--primary: oklch(0.70 0.10 170);

/* Line 89 — was: oklch(0.21 0.006 285.885) */
--primary-foreground: oklch(0.18 0.015 170);

/* Line 99 — was: oklch(0.552 0.016 285.938) */
--ring: oklch(0.55 0.08 170);

/* Line 107 — was: oklch(0.488 0.243 264.376) */
--sidebar-primary: oklch(0.70 0.10 170);
```

Leave all other variables in `.dark` unchanged (`--background`, `--foreground`, `--card`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--destructive`, `--sidebar`, `--sidebar-foreground`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`, `--chart-*`).

- [ ] **Step 2: Verify dark mode renders correctly**

In `app/layout.tsx`, temporarily change `className="light"` to `className="dark"` on the `<html>` tag (or toggle via browser dev tools by adding the `dark` class to `<html>`).

Verify:
- The send button is a lighter teal that reads well on dark surfaces
- The sidebar ד icon square is lighter teal
- Focus rings show muted teal
- Text on the teal send button is dark (not white)
- All dark mode surfaces remain the existing dark grays — no teal wash

Revert the class back to `"light"` if you changed it.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: apply muted teal accent palette to dark mode CSS variables"
```

---

### Task 3: Add buildings brand mark SVG to welcome screen

**Files:**
- Modify: `components/assistant-ui/thread.tsx:80-108` (`ThreadWelcome` component)

- [ ] **Step 1: Add the buildings SVG above the title in ThreadWelcome**

In `components/assistant-ui/thread.tsx`, replace the `ThreadWelcome` component (lines 80-108) with:

```tsx
const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="aui-thread-welcome-center flex w-full flex-grow flex-col items-center justify-center">
          <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-8">
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="aui-thread-welcome-brand mb-4"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="text-primary"
                aria-hidden="true"
              >
                <rect x="6" y="20" width="14" height="24" rx="2" fill="currentColor" />
                <rect x="24" y="8" width="18" height="36" rx="2" fill="currentColor" opacity="0.7" />
                <rect x="9" y="24" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="9" y="30" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="9" y="36" width="3" height="3" rx="0.5" fill="white" opacity="0.5" />
                <rect x="14" y="24" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="14" y="30" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="14" y="36" width="3" height="3" rx="0.5" fill="white" opacity="0.5" />
                <rect x="28" y="12" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="28" y="18" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="28" y="24" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="28" y="30" width="3" height="3" rx="0.5" fill="white" opacity="0.5" />
                <rect x="35" y="12" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="35" y="18" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="35" y="24" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
                <rect x="35" y="30" width="3" height="3" rx="0.5" fill="white" opacity="0.5" />
              </svg>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="aui-thread-welcome-message-motion-1 text-2xl font-semibold"
            >
              דירות - אנליסט פינוי בינוי
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1 }}
              className="aui-thread-welcome-message-motion-2 text-2xl text-muted-foreground/65"
            >
              שאלו אותי על פרויקטי פינוי בינוי, תשתיות ופוטנציאל השקעה
            </m.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
```

Key changes from the original:
- Added a new `m.div` wrapper with the buildings SVG before the title
- SVG uses `className="text-primary"` and `fill="currentColor"` so it adapts to both light and dark mode
- The taller building uses `opacity="0.7"` for depth
- Windows use white fill with varying opacity
- `aria-hidden="true"` since it's decorative
- `mb-4` spacing between the SVG and the title

- [ ] **Step 2: Verify the welcome screen in both modes**

Run: `pnpm dev`

Open `http://localhost:7000`. Start a new conversation (or refresh to see the welcome screen). Verify:
- Buildings SVG appears above the title text
- SVG is teal colored (matching the send button)
- Fade-in animation plays on the SVG
- Toggle dark mode (add `dark` class to `<html>` in dev tools): SVG color changes to the lighter dark-mode teal
- Window rectangles remain visible in both modes

- [ ] **Step 3: Commit**

```bash
git add components/assistant-ui/thread.tsx
git commit -m "style: add buildings brand mark SVG to welcome screen"
```

---

### Task 4: Visual QA and final commit

**Files:**
- None created or modified — this is a verification task

- [ ] **Step 1: Run the type checker**

Run: `pnpm build`

Expected: Build succeeds with no type errors.

- [ ] **Step 2: Run the linter**

Run: `pnpm lint`

Expected: No new lint errors.

- [ ] **Step 3: Full visual QA checklist**

With `pnpm dev` running, verify each item in the browser:

**Light mode:**
- [ ] Send button is muted teal
- [ ] Sidebar ד icon is muted teal
- [ ] Active sidebar thread has faint teal highlight
- [ ] Suggestion card hover shows faint teal background
- [ ] Buildings SVG on welcome screen is teal
- [ ] Focus rings on inputs/buttons are teal
- [ ] Login page submit button is teal (navigate to `/login`)
- [ ] All surfaces remain neutral white/gray (no teal wash)

**Dark mode** (toggle `dark` class on `<html>`):
- [ ] Send button is lighter teal, readable on dark background
- [ ] Text on send button is dark (not white)
- [ ] Buildings SVG adapts to lighter teal
- [ ] Sidebar icon adapts to lighter teal
- [ ] Focus rings are muted teal
- [ ] All dark surfaces remain existing grays

- [ ] **Step 4: Commit if any fixes were needed**

If any adjustments were made during QA:

```bash
git add -A
git commit -m "style: visual QA fixes for muted teal palette"
```
