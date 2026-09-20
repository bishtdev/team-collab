# Kiln — Design Contract

The single source of truth for the product's visual language. If a component, page, or review disagrees with this document, the document wins until it is deliberately changed here.

Full narrative and page blueprints: `../ui_renovation.md`. Agent rules: `../.opencode/skills/kiln-design-system/SKILL.md`.

## Identity

Kiln is an earth-materials language. Work enters raw and leaves fired. Warm neutrals, moss and ochre accents, a characterful grotesque for display, quiet interiors. Dark is the default theme; light is a first-class peer.

## Color

Primitives live in `src/styles/primitives.css` (umber, oat, moss, gilt, rust, teal). **Components never reference primitives.** They use semantic tokens from `src/styles/theme.css`, exposed to Tailwind through `@theme inline` in `src/App.css`.

| Semantic token | Light | Dark | Job |
|---|---|---|---|
| `background` | `#F6F1E4` | `#15120D` | app canvas |
| `surface` | `#FEFCF7` | `#1D1913` | cards, panels, sidebar |
| `surface-raised` | `#FFFFFF` | `#262119` | popovers, menus, dialogs |
| `border` | `#E2D9C6` | `#332C22` | all borders |
| `input` | `#EBE3D1` | `#2B251C` | field wells |
| `foreground` | `#221D14` | `#EDE6D6` | primary text |
| `muted-foreground` | `#6C6352` | `#A79E8D` | secondary text |
| `faint` | `#8C8371` | `#7B7263` | placeholders, meta |
| `primary` / `primary-foreground` | `#5A7032` / `#F6F1E4` | `#AFC381` / `#14170D` | brand (moss) actions |
| `highlight` | `#8A6A1B` | `#D9B45B` | gilt accents, in-progress |
| `success` / `warning` / `danger` / `info` | `#4E6B2E` / `#96630F` / `#A63D2F` / `#33616F` | `#9CB86F` / `#DFA14A` / `#E08276` / `#7CA3B2` | feedback |
| `status-todo` / `status-progress` / `status-done` | `#6F6552` / `#96630F` / `#4E6B2E` | `#A79E8D` / `#D9B45B` / `#9CB86F` | kanban |
| `ring` | `#617A35` | `#94AB5F` | focus |
| `overlay` | `rgba(42,36,26,.45)` | `rgba(10,8,5,.65)` | modal scrims |

Tailwind has both `*-surface` and the shadcn aliases (`*-card`, `*-popover`) pointing at the same values. shadcn semantics are intentional: **`primary` is the brand moss; `accent` is only a hover surface** — do not repurpose either.

Charts use `chart-1..5` (moss, gilt, teal, rust, umber).

## Typography

| Face | Role | Notes |
|---|---|---|
| Bricolage Grotesque Variable | display: `h1`, `h2`, wordmark, dashboard numerals | `font-display` |
| Instrument Sans Variable | everything else | `font-sans` (body default) |
| Spline Sans Mono Variable | IDs, keys, shortcuts only | `font-mono` |

Scale utilities: `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body` (default), `text-small`, `text-micro`. Negative tracking only on `display`/`h1`/`h2`. Data uses `tabular-nums`.

## Shape, depth, motion

- Radii: `rounded-xs` 6 · `rounded-sm` 8 · `rounded-md` 10 · `rounded-lg` 14 (cards) · `rounded-xl` 18 (dialogs/sheets) · `rounded-full` avatars.
- Elevation: `shadow-card`, `shadow-pop`, `shadow-overlay` — warm-tinted, defined per theme. Never raw `rgba` shadows in components.
- Fired edge: `inset 0 1px 0` highlight, baked into card elevation and available via `.fired-edge`.
- Motion: `duration-150/200/300`, `ease-kiln`. One settle per route (`.kiln-settle`). Nothing bounces.
- Grain (`.kiln-grain`) and the arch motif: auth, empty states, 404 only.

## Rules

Do:
- Compose from `src/components/ui/*` and `src/components/product/*`.
- Extend a primitive with a variant (cva) when a page needs a new look.
- Give every async action success and error toast feedback (Sonner).
- Design loading (Skeleton), empty (EmptyState), and error states for every data surface.
- Check both themes and `/design` before finishing.

Don't:
- Use raw palette classes, hex values, or arbitrary color classes — `npm run lint:tokens` fails them.
- Use `window.confirm`, `window.location.reload()`, or raw `<a href>` for in-app navigation.
- Render fake data (placeholder priorities, counts, dates).
- Use emoji as icons; icons are lucide at `strokeWidth` 1.75 (16px) or 1.5 (20px+).
- Restyle a page with local classes instead of fixing the primitive/token.

## Files

```
src/styles/primitives.css     raw ramps (change for a total re-color)
src/styles/theme.css          semantic tokens per theme (the contract)
src/styles/utilities.css      grain, settle, fired-edge helpers
src/App.css                   Tailwind entry + @theme inline map
src/components/theme/         ThemeProvider (default dark), ThemeToggle
src/components/ui/            shadcn-style primitives
src/components/product/       BrandMark, UserAvatar, StatusBadge, PageHeader, EmptyState, Kbd
scripts/check-tokens.mjs      token enforcement
src/pages/Styleguide.jsx      /design — live gallery of tokens and components
```

## Voice

Plain, active, sentence case. Buttons name their outcome ("Create project", "Save changes"). Errors say what happened and how to recover. Empty states invite the next action. One name per concept, everywhere.
