# Dirot Visual Design — Muted Teal Accent

## Summary

Apply a muted teal color palette to the Dirot application using an accent-only strategy. Color appears on interactive elements (buttons, links, active states, brand mark) while all surfaces stay neutral. Add a buildings brand mark SVG to the welcome screen. Support both light and dark modes.

## Decisions

- **Palette**: Muted teal (OKLCH hue ~170, low-to-medium chroma)
- **Strategy**: Accent-only — surfaces (background, card, sidebar, muted) remain neutral gray
- **Brand mark**: Two-building SVG with windows on the welcome screen, above the title
- **Scope**: CSS variable swap + welcome screen SVG + minor component tweaks
- **Dark mode**: Yes, full support with adjusted teal values for dark surfaces

## Color System Changes (globals.css)

Only these CSS variables change. Everything else stays as-is.

### Light mode (:root)

```
--primary:                  oklch(0.35 0.08 170)    /* was oklch(0.21 0.006 285.885) */
--primary-foreground:       oklch(0.985 0 0)        /* unchanged */
--ring:                     oklch(0.50 0.10 170)    /* was oklch(0.705 0.015 286.067) */
--accent:                   oklch(0.93 0.015 170)   /* was oklch(0.967 0.001 286.375) */
--accent-foreground:        oklch(0.25 0.04 170)    /* was oklch(0.21 0.006 285.885) */
--sidebar-primary:          oklch(0.35 0.08 170)    /* was oklch(0.21 0.006 285.885) */
--sidebar-primary-foreground: oklch(0.985 0 0)      /* unchanged */
--sidebar-accent:           oklch(0.93 0.015 170)   /* was oklch(0.967 0.001 286.375) */
--sidebar-accent-foreground: oklch(0.25 0.04 170)   /* was oklch(0.21 0.006 285.885) */
```

### Dark mode (.dark)

```
--primary:                  oklch(0.70 0.10 170)    /* was oklch(0.92 0.004 286.32) */
--primary-foreground:       oklch(0.18 0.015 170)   /* was oklch(0.21 0.006 285.885) */
--ring:                     oklch(0.55 0.08 170)    /* was oklch(0.552 0.016 285.938) */
--sidebar-primary:          oklch(0.70 0.10 170)    /* was oklch(0.488 0.243 264.376) */
--sidebar-primary-foreground: oklch(0.985 0 0)      /* unchanged */
```

### Unchanged variables (both modes)

All of these stay as-is:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--destructive`
- `--border`, `--input`
- `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-ring`
- `--chart-1` through `--chart-5`

## Welcome Screen Brand Mark

Add an inline SVG to the `ThreadWelcome` component in `components/assistant-ui/thread.tsx`.

**SVG spec:**
- Two buildings side by side (shorter left, taller right)
- Small window rectangles with varying opacity
- ~48x48px, centered above the title
- Uses `text-primary` color class (via `currentColor` or Tailwind) so it adapts to dark mode
- Static, no animation

**Welcome screen structure (top to bottom):**
1. Buildings SVG (new)
2. Title — "דירות - אנליסט פינוי בינוי" (existing)
3. Subtitle (existing)
4. Suggestion cards (existing)

## Component Changes

### thread.tsx
- Add buildings SVG to `ThreadWelcome` above the title
- Ensure send button uses `bg-primary` (may already be the case via the existing styling)

### globals.css
- Swap CSS variable values as specified above

### No changes needed
- `button.tsx` — variants reference tokens, picks up teal automatically
- `threadlist-sidebar.tsx` — sidebar header icon uses `bg-sidebar-primary`, picks up teal
- `login/page.tsx`, `signup/page.tsx` — links use `text-primary`, buttons use `bg-primary`
- `auth/login-form.tsx`, `auth/signup-form.tsx` — submit buttons use primary variant

## Files Modified

1. `app/globals.css` — CSS variable value swaps (~8 light mode, ~5 dark mode)
2. `components/assistant-ui/thread.tsx` — Add buildings SVG to welcome screen

## Out of Scope

- Logo/favicon changes
- Welcome screen layout restructuring
- New components or pages
- Chart color updates (can be done separately)
- Sidebar structural changes
