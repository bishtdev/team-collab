---
name: kiln-design-system
description: Use when building, restyling, or reviewing ANY frontend UI in this repo (React/Vite/Tailwind v4/shadcn) - components, pages, Tailwind classes, colors, typography, theming, dark/light mode, auth screens, kanban, chat. Defines the "Kiln" product identity, semantic token contract, and anti-slop rules. Load before writing any JSX or CSS under frontend/src.
license: Project-internal
metadata:
  system: Kiln
  plan: ui_renovation.md
  contract: frontend/DESIGN.md
---

# Kiln Design System

The product's visual identity is **Kiln**: an earth-materials language for a work platform. Work enters raw and leaves fired — teams shape projects, tasks, and conversation into something that holds. Every screen should feel warm, physical, and deliberate; never like a default template.

Full specifications, color tables, page blueprints, and phase plans live in `ui_renovation.md` (repo root). The living token contract lives in `frontend/DESIGN.md` once Phase 0 is complete. This skill is the fast reference.

## Non-negotiable identity rules

1. **Color**: earth tones only. Brand green is **moss**, secondary accent is **gilt** (ochre gold), neutrals are **umber** (dark) / **oat** (light). Never introduce blue-purple SaaS gradients, pure black `#000`, pure white `#fff` text, or Claude-style cream+terracotta combinations. Danger is **rust**; info is dusty **teal**.
2. **Typography**: display face is **Bricolage Grotesque** (wordmark, page titles, auth headlines, big numbers). UI/body face is **Instrument Sans**. **Spline Sans Mono** only for real machine data (IDs, keys, shortcuts) — never as a decorative label style. Never use Inter/Roboto/system defaults as the primary UI face.
3. **Depth**: shadows are warm-tinted (umber rgba), never neutral gray. Cards carry the "fired edge" — a 1px inset top highlight (`inset 0 1px 0 rgba(255,255,255,.05)` dark). One elevation language: `shadow-card`, `shadow-pop`, `shadow-overlay`.
4. **Theme**: dark is the default. Every surface, component, and state MUST be correct in both themes. Theme switches via `.dark` class on `<html>` managed by `ThemeProvider` (localStorage key `kiln-theme`).
5. **Motion**: unhurried and purposeful. 120ms micro, 200ms standard, 320ms enters. Easing `cubic-bezier(.22,.61,.36,1)`. No bounce, no spring, no per-section scroll animations. Respect `prefers-reduced-motion`.
6. **Restraint**: one bold moment per surface. The arch motif and grain belong to auth/empty states only. Interior app surfaces stay quiet.

## Token contract (globality)

Components may only consume **semantic** utilities. This is what makes a future redesign a token-file change instead of a refactor.

Allowed: `bg-background`, `bg-surface`, `bg-surface-raised`, `text-foreground`, `text-muted-foreground`, `text-faint`, `border-border`, `bg-input`, `bg-primary text-primary-foreground`, `text-highlight`, `text-success`, `text-warning`, `text-danger`, `text-info`, `bg-status-todo|progress|done`, `ring-ring`, `font-display|sans|mono`, `text-display|h1|h2|h3|body|small`, `rounded-xs|sm|md|lg|xl`, `shadow-card|pop|overlay`, `duration-*`, `ease-kiln`.

Forbidden in app code: `bg-gray-*`, `bg-slate-*`, `bg-black`, `bg-white`, `text-white`, `text-black`, `bg-[#...]`, `text-[#...]`, any hex/rgba in `className` or inline styles (except inside `src/styles/*.css` and token definitions), one-off arbitrary shadows.

File map:

```
frontend/src/styles/primitives.css   raw ramps (umber, moss, gilt, rust, teal) - never imported by components
frontend/src/styles/theme.css        semantic tokens: :root (light) + .dark (dark)
frontend/src/styles/utilities.css    grain, arch, fired-edge helpers
frontend/src/App.css                 tailwind entry + @theme inline mapping + base layer
frontend/src/components/theme/       ThemeProvider, ThemeToggle
frontend/src/pages/Styleguide.jsx    /design gallery - visual source of truth
frontend/scripts/check-tokens.mjs    npm run lint:tokens (forbidden class scanner)
```

## Component rules

- All primitives live in `src/components/ui/*` (shadcn-style, cva variants, `cn()`), so app code composes, never restyles. If a page needs a new look, extend the primitive with a variant instead of adding classes at the call site.
- Every interactive element: visible `focus-visible` ring (2px primary, 2px offset), disabled state, hover state, loading state where async.
- Status colors are semantic: todo = stone/umber, in-progress = gilt, done = moss. Never hardcode status hues.
- Avatars are initials on stable hashed warm palettes; no stock photos.
- Radix-based dialogs/sheets/popovers only (focus trap + escape). Delete confirms use `AlertDialog`, never `window.confirm`.
- Toasts (Sonner) styled via theme tokens: `surface-raised` + `border` + `shadow-pop`. Every mutation gets success + error feedback; never silent failures.
- Empty, loading (Skeleton), and error states are designed per surface - no bare spinners, no blank screens.

## Voice

Plain, active, specific. Buttons name their outcome ("Save changes", "Create project"). Sentence case everywhere. No filler, no hype, no clever slogans; errors state what happened and how to fix it; empty states invite the next action. Consistent vocabulary across the whole flow ("project" is always project).

## Anti-slop checklist (run before calling UI work done)

- No all-caps tracked "eyebrow" labels; no `A · B · C` middot meta strings.
- No every-card-has-the-same-radius-and-shadow grids; vary hierarchy deliberately.
- No side-tab accent borders on rounded cards; no gradient washes as decoration.
- No emoji as UI icons; icons are lucide, `strokeWidth` 1.75 at 16px / 1.5 at 20px+, `currentColor` only.
- No fake data (priority "High", "2 attachments", placeholder dates). Render only real data; hide what doesn't exist yet.
- No per-section fade-and-slide; one settle animation per route at most.
- No `window.location.reload()` for state changes; no raw `<a href>` for in-app navigation.
- Both themes reviewed side by side at `/design`; contrast meets WCAG AA (4.5:1 body, 3:1 large/UI).

## Workflow for UI changes

1. Read `frontend/DESIGN.md` (or `ui_renovation.md` until it exists) and this skill.
2. Check `/design` styleguide for the primitive you need; reuse or extend it.
3. Build with semantic tokens only; verify both themes.
4. Run `npm run lint` and `npm run lint:tokens`; fix everything they flag.
5. Self-critique with screenshots in dark and light; remove one accessory before finishing.
