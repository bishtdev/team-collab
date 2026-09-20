# UI Renovation Plan — "Kiln" Design Language

Status: **implemented** (Phases 0–4 complete; see Implementation status below)
Scope: `frontend/` only (no backend or API changes)
Owner: Design Lead (agent-assisted)
Related: `plan2.md` (feature roadmap), `.opencode/skills/kiln-design-system/SKILL.md`, `frontend/DESIGN.md` (created in Phase 0)

## Implementation status

**Base correction (important):** the working checkout was 16 commits behind `origin/master`. The local base (`59d35d5`) predates all feature work: attachments (Cloudinary), real-time notifications, priority/due-date editing, task comments, activity feed, subtasks, task detail modal, Redux store + slices, per-team roles, socket auth. Those features live on `origin/master` (`0c643be`) and were never in the working tree. The working tree has been fast-forwarded to `0c643be`; the earlier renovation work (built on the stale base) is preserved in `git stash` and in `%TEMP%\opencode\kiln-renovation-backup`.

| Work | State |
|---|---|
| Feature restore from `origin/master` (91 files, +7812/−1591) | Done — `master` now at `0c643be` |
| Kiln foundation re-applied to the real app: `styles/primitives.css` + `theme.css` + `utilities.css`, `App.css` theme map, `ThemeProvider` (dark default), fonts, favicon, `DESIGN.md`, `scripts/check-tokens.mjs`, `/design` styleguide, 404, error boundary, all 20 `ui/*` primitives | Done — `npm run build` green |
| Restyle feature components to Kiln while preserving all functionality: `AppLayout` (incl. notification bell), `AuthLayout`, `Login`, `Signup`, `Projects`, `KanbanBoard`, `ProjectHeader`, `ProjectKanban`, `TeamSetup`, `ChatPage`, `Modal`, all `modals/*` (AddTask, TaskDetail, AddUserToTeam, ChangeRole, CreateTeam, ProjectForm), `NotificationPanel`, `ActivityFeedPanel`, `SubtasksPanel`, `TaskCommentsPanel`, `CommentItem`, `ProtectedRoute`, `PublicRoute` | **Done** — every surface restyled with logic preserved (Redux actions, socket events, permissions, inline editors, attachment/subtask/comment flows). `window.confirm` replaced with `AlertDialog`; `react-icons` replaced with lucide everywhere |
| Token lint enforcement across the real component set | Done — `npm run lint:tokens` passes with zero violations app-wide |
| Dead code and deps removed | `components/Layout.jsx`, `components/SortableItem.jsx`, `components/ExampleShadcn.jsx`; uninstalled `react-icons`, `react-beautiful-dnd`, `@dnd-kit/modifiers`, `next-themes` |
| Post-restyle fixes | `/setup-team` crash on legacy team-member shapes (defensive `memberName`/`memberKey`); all modals mis-centered because `.kiln-settle` (`fill-mode: both`) kept a `transform` alive, making the page wrapper the containing block for `fixed` overlays (`fill-mode` now `backwards`); notification panel clipped off-screen in the sidebar (new `position="up-right"` placement + `max-w-[calc(100vw-2rem)]` + anchor-aware click-outside); team-switch now reports failures with a toast instead of an unhandled rejection |
| Layout fixes | App shell is now `h-dvh overflow-hidden` (main scrolls internally) instead of `min-h-screen`, so full-height pages resolve; restored the `main` page padding that had been lost; Kanban columns now `flex-1 basis-0 min-w-[280px]` — evenly filling the full width and height with internal card scroll; chat header + composer are pinned with only the message list scrolling (`min-h-0 flex-1 overflow-y-auto`) |
| First-pass UX ported back | Toast feedback across task/project/team/member create-rename-delete + move/assign errors and signup welcome; forgot-password via Firebase `sendPasswordResetEmail` with toast; chat "Live / Reconnecting" indicator + offline send guard; collapsed 72px sidebar rail with tooltips for md screens; per-column `+` quick-add (AddTaskModal `defaultStatus`); avatar dropdown assignee picker on cards; project cards with hover elevation, "updated X ago", full-width Open board; Members list card on the Team page |
| Backend | No changes needed; `npm install` run for new deps; Cloudinary env keys present. The prior local robustness patch to `backend/server.js` (Firebase credential fallback) is superseded — origin's version already handles env/file modes. |

Verification: `npm run lint:tokens` passes with zero violations app-wide; `npm run lint` is clean (one pre-existing `exhaustive-deps` warning in `TaskDetailModal`); `npm run build` succeeds and the compiled CSS contains every Kiln token and utility. Visual review in both themes is recommended on a running dev server.

Wordmark rename to **Kiln** approved and applied (index.html, BrandMark, README, auth copy).



---

## 1. Brief

TeamCollab is a real product for real teams: projects, a kanban board, and team chat. Today it looks like what it is underneath — a scaffold. The goal of this renovation is to give the product a **single, unmistakable visual identity** with the confidence of Claude, Notion, or Cohere, without copying any of them.

Two constraints shape everything:

1. **Identity must be systematic, not decorative.** Every color, font, radius, shadow, and motion curve lives in global design tokens. Changing the product's look in the future should mean editing one token file, not hunting through 20 components.
2. **Dark-first, light-optional.** Dark is the default theme; light must be equally finished. Both are driven by the same semantic token contract.

The result is a design language we call **Kiln**.

---

## 2. Diagnosis — why it reads as "AI slop" today

These are concrete findings from the current code, not vibes:

| # | Problem | Evidence |
|---|---------|----------|
| 1 | Two competing UI languages | shadcn components in `TeamSetup.jsx` vs raw `<input>/<button>/<select>` everywhere else |
| 2 | No theme system | Hardcoded `bg-black`, `bg-gray-900`, `text-white` across pages; `.dark` tokens in `App.css` are defined but nothing consumes them coherently |
| 3 | Default shadcn slate/blue tokens | `App.css` still ships the stock shadcn palette; the product has no color identity |
| 4 | Fake data in the UI | Kanban cards show hardcoded "High" priority, "2" attachments, "Aug 10" due date (`KanbanBoard.jsx`) — instant credibility killer |
| 5 | Default template branding | `index.html` title is "Vite + React" with the Vite favicon |
| 6 | Amateur interaction patterns | `window.confirm` for deletes, hand-rolled unfocusable modal, no toasts (Sonner mounted but unused), silent failures |
| 7 | No state design | Spinners only; no skeletons, no empty-state system, no error states |
| 8 | No hierarchy | Same radius/shadow/padding for everything; every list rendered as an identical card grid |
| 9 | Auth pages are bare | Centered box on black; no brand statement, no differentiation between login and signup |
| 10 | No enforcement | Nothing stops the next feature from adding more `bg-gray-*` classes |

The renovation fixes the system, not just the pixels.

---

## 3. The identity — "Kiln"

**Concept.** A kiln is where raw material is shaped and fired until it holds. That is what this product does for a team's work. The design language borrows from earth materials — umber, clay, moss, oat, gilt — and from craft: warm-tinted depth, a single arch motif, quiet confidence.

**Personality.** Grounded, warm, precise. A craftsman's workspace, not a spaceship dashboard. The interface never shouts; it is confident enough to be quiet.

**What we deliberately avoid** (the current AI-generated clichés):
- Cream `#F4F1EA` + high-contrast serif + terracotta `#D97757` (Claude's own palette is a trap for us, not a target)
- Near-black + single acid accent
- Blue-purple SaaS gradients
- All-caps tracked eyebrow labels, `A · B · C` meta strings, decorative monospace labels
- Uniform rounded card grids with one soft gray shadow
- Fade-and-slide entrance on every section

**One bold moment, everything else quiet.** The bold moment is the **auth experience**: an editorial panel with the arch motif, grain, and oversized Bricolage headline. The app interior stays disciplined and legible.

---

## 4. Color

### 4.1 Primitive ramps (defined once in `primitives.css`, never referenced by components)

| Ramp | Role | Key steps |
|------|------|-----------|
| **Umber** | warm neutral, dark surfaces | 950 `#16130E` · 900 `#1B1812` · 850 `#221E17` · 800 `#2A251C` · 700 `#3A3327` · 500 `#6F6552` · 400 `#938874` · 300 `#B4A992` · 100 `#EAE2D0` |
| **Oat** | warm neutral, light surfaces | 100 `#F7F2E7` · 200 `#EFE7D8` · 300 `#E3D8C3` · 500 `#B0A287` · 700 `#635842` · 900 `#2A241A` |
| **Moss** | brand primary (olive-green) | 300 `#AEC183` · 400 `#94AB5F` · 600 `#617A35` · 700 `#4A5F28` |
| **Gilt** | secondary accent (ochre gold) | 300 `#E7C878` · 400 `#D9B45B` · 600 `#9E7A22` · 700 `#7C5E14` |
| **Rust** | danger | 400 `#E08276` · 600 `#A63D2F` |
| **Teal** | info (dusty) | 400 `#7CA3B2` · 600 `#33616F` |

Why moss instead of terracotta: earth-tone requirement, but green-primary gives the product its own signal and steers clear of the Claude tell. Gilt carries energy (in-progress, highlights) without becoming a second brand color.

### 4.2 Semantic tokens (the only colors components use)

**Dark theme (default, `.dark`)**

| Token | Value | Use |
|-------|-------|-----|
| `background` | `#15120D` | app canvas |
| `surface` | `#1D1913` | cards, panels |
| `surface-raised` | `#262119` | popovers, dropdowns, hover |
| `border` | `#332C22` | all borders |
| `input` | `#2B251C` | field backgrounds |
| `foreground` | `#EDE6D6` | primary text (warm bone, never `#fff`) |
| `muted-foreground` | `#A79E8D` | secondary text |
| `faint` | `#7B7263` | tertiary/placeholders |
| `primary` / `primary-foreground` | `#AFC381` / `#14170D` | brand actions |
| `ring` | `#94AB5F` | focus rings |
| `highlight` | `#D9B45B` | in-progress, accents |
| `success` / `warning` / `danger` / `info` | `#9CB86F` / `#DFA14A` / `#E08276` / `#7CA3B2` | feedback |
| `status-todo / progress / done` | `#A79E8D` / `#D9B45B` / `#9CB86F` | kanban |

**Light theme (`:root`)**

| Token | Value | Use |
|-------|-------|-----|
| `background` | `#F6F1E4` | warm oat canvas |
| `surface` / `surface-raised` | `#FEFCF7` / `#FFFFFF` | panels |
| `border` / `input` | `#E2D9C6` / `#EBE3D1` | |
| `foreground` | `#221D14` | ink |
| `muted-foreground` / `faint` | `#6C6352` / `#8C8371` | |
| `primary` / `primary-foreground` | `#5A7032` / `#F6F1E4` | |
| `highlight` | `#8A6A1B` | |
| `success` / `warning` / `danger` / `info` | `#4E6B2E` / `#96630F` / `#A63D2F` / `#33616F` | |

Notes:
- shadcn semantics are preserved: brand green maps to `--primary`; shadcn's `--accent` remains a subtle hover surface. `DESIGN.md` will state this explicitly so no one "fixes" it later.
- Final WCAG AA tuning happens in Phase 0 with a contrast script; the values above are the design intent.

---

## 5. Typography

### 5.1 Families (self-hosted via Fontsource — verified available at v5.3.0)

| Role | Family | Usage |
|------|--------|-------|
| Display | **Bricolage Grotesque Variable** (500–700, optical size) | wordmark, page titles, auth headlines, dashboard numbers |
| UI / body | **Instrument Sans Variable** (400–600) | everything else — labels, buttons, prose, tables |
| Mono | **Spline Sans Mono Variable** | IDs, keyboard hints, actual code — never decorative labels |

Bricolage gives the product a face — a wide, slightly warm grotesque with real personality at display sizes, unlike the Inter/Geist default. Instrument Sans keeps dense UI humane without being precious. No serif anywhere: the identity comes from color, material, and the grotesque's character — not from the cream+serif cliché.

### 5.2 Scale (tokens: `--text-display … --text-micro`)

| Token | Size / line-height / tracking | Face | Where |
|-------|-------------------------------|------|-------|
| `display` | 40 / 46 / -0.03em / 600 | Bricolage | auth headline, 404 |
| `h1` | 30 / 36 / -0.02em / 600 | Bricolage | page titles |
| `h2` | 22 / 28 / -0.015em / 600 | Bricolage | section titles, dialog titles |
| `h3` | 17 / 24 / -0.01em / 600 | Instrument Sans | card titles, column headers |
| `body` | 15 / 23 / 0 / 400 | Instrument Sans | default UI text (raised from 14 for warmth) |
| `small` | 13 / 19 / 0 / 400 | Instrument Sans | metadata, helper text |
| `micro` | 11.5 / 16 / 0.01em / 500 | Instrument Sans | timestamps, counts (tabular numerals) |

Rules: negative tracking only at display sizes; timestamps/counts use `font-variant-numeric: tabular-nums`; line length capped at 72ch for prose.

---

## 6. Space, shape, depth, motion

- **Spacing**: 4px base. Component padding 12/16/20. Page gutters 24 (mobile) / 32 (tablet) / 40 (desktop). Section rhythm 24/32/48.
- **Radius** (`--radius-xs…xl`): 6 (badges, kbd) · 8 (small controls) · 10 (buttons, inputs) · 14 (cards, columns) · 18 (dialogs, sheets). Avatars full. One radius per role, everywhere.
- **Depth**: warm-tinted shadows only — `shadow-card`, `shadow-pop`, `shadow-overlay` defined in `primitives.css` with umber rgba (light theme uses a softer oat-brown). Every card carries the **fired edge**: `inset 0 1px 0 rgba(255,255,255,.05)` (dark) / `rgba(255,255,255,.8)` (light) — the light catching a fired surface.
- **Motion**: `--dur-1` 120ms (hover/press) · `--dur-2` 200ms (panels, dropdowns) · `--dur-3` 320ms (route settle). `--ease-kiln: cubic-bezier(.22,.61,.36,1)`. One "settle" per route (fade + 4px rise, once). Drag overlay gets a 1.5° rotation — physical, not playful. `prefers-reduced-motion` disables all non-essential motion.
- **Grain**: an SVG noise layer at ~2.5% opacity, applied only to the auth editorial panel, empty states, and the 404 — never to scrolling work surfaces.

---

## 7. Global theming architecture

This is the part that makes future redesigns cheap. Components never know what a color *is*; they only know its *job*.

### 7.1 Files

```
frontend/
├── index.html                     # title, favicon, anti-FOUC theme script, dark by default
├── src/
│   ├── App.css                    # tailwind entry: imports styles/ + @theme inline mapping + base layer
│   ├── styles/
│   │   ├── primitives.css         # raw ramps, shadow recipes, radii. Components never see this file.
│   │   ├── theme.css              # semantic tokens: :root (light) and .dark (dark)
│   │   └── utilities.css          # @utility grain, arch, fired-edge, text-balance helpers
│   ├── components/theme/
│   │   ├── ThemeProvider.jsx      # context + localStorage('kiln-theme'), default 'dark', applies .dark + color-scheme
│   │   └── ThemeToggle.jsx        # sun/moon control for the sidebar user menu
│   ├── pages/Styleguide.jsx       # /design — every token & component, both themes, side by side
│   └── ...
├── scripts/check-tokens.mjs       # scans src/**/*.{jsx,tsx} for forbidden palette classes/hex
└── DESIGN.md                      # the contract: token tables, usage rules, rationale (Phase 0)
```

### 7.2 `@theme inline` additions (in `App.css`)

Maps semantic tokens to Tailwind's namespace so utilities exist: `--color-surface`, `--color-surface-raised`, `--color-faint`, `--color-highlight`, `--color-success`, `--color-warning`, `--color-info`, `--color-status-todo|progress|done`; `--font-display|sans|mono`; `--text-display|h1|h2|h3|body|small|micro`; `--shadow-card|pop|overlay`; `--ease-kiln`; plus the existing shadcn token names (kept, re-valued).

### 7.3 Enforcement (so it stays global)

1. `npm run lint:tokens` — fails on `bg-gray-*`, `text-white`, `bg-black`, arbitrary `[...]` colors, and hex/rgba in JSX across `src/`.
2. Convention documented in `DESIGN.md`; the `kiln-design-system` skill is loaded by any agent before UI work (already installed).
3. `/design` styleguide is the single place to verify and preview; every new primitive must be added there.

### 7.4 Theme behavior

Dark default, even before React hydrates (inline script in `index.html` reads `kiln-theme` and sets the class + `color-scheme`). Toggle offers **Dark / Light / System**; "System" only follows the OS when explicitly chosen. `meta[name="theme-color"]` updates per theme.

---

## 8. Component system

shadcn stays — it is the right substrate. But every primitive is re-skinned to Kiln tokens and completed where gaps exist. Pages then compose primitives only; page-level restyling is forbidden.

| Component | Action |
|-----------|--------|
| `button` | Rebuild: variants `primary / secondary / ghost / outline / danger`, sizes `sm / md / lg / icon`, loading spinner state, focus ring, active press (scale 0.98) |
| `badge` | Variants: `neutral / moss / gilt / rust / teal` + `status` (todo/progress/done). Small radius 6, not pills by default |
| `card` | New anatomy (`CardHeader/Title/Description/Content/Footer`), fired edge, `shadow-card`, radius 14 |
| `dialog` | Restyle: radius 18, warm overlay (`umber-950/70` + 4px blur), title in `h2`, footer button alignment |
| `input` / `textarea` / `label` / `select` | Radius 10, `bg-input`, focus ring moss, explicit error state (rust border + helper message), disabled styling |
| `sonner` | Theme-aware toasts on `surface-raised` + `border` + `shadow-pop`; `<Toaster>` finally used for every mutation |
| **new** `avatar` | Initials on stable hashed warm palettes; sizes 20/24/32/40; stacked group with `+N` |
| **new** `dropdown-menu`, `tooltip`, `separator`, `scroll-area` | Radix-based, Kiln-skinned |
| **new** `tabs`, `switch`, `checkbox`, `progress` | For forms, settings, project cards |
| **new** `alert-dialog` | Replaces every `window.confirm` |
| **new** `skeleton`, `sheet` | Loading states + mobile sidebar |
| **new (custom)** `BrandMark`, `StatusBadge`, `PageHeader`, `EmptyState`, `Kbd`, `UserAvatar` | Product-specific primitives |
| `draggable` / `droppable` (kanban) | Restyle for new card anatomy, drag states, drop-target ring |
| Dead code | Delete `SortableItem.jsx`, `ExampleShadcn.jsx`, broken `KanbanBoardWrapper`; uninstall `react-beautiful-dnd`, `@dnd-kit/modifiers` |

---

## 9. Page blueprints

### 9.1 Auth — Login & Signup (the identity debut)

Split layout, no app chrome. Left editorial panel (46%, hidden on mobile → compact brand header): umber gradient, grain, and the **arch motif** — three concentric arches (SVG) in moss/gilt at low opacity, like a kiln mouth. Oversized Bricolage headline, 3 short plain-language lines (no feature-card grid).

```
┌───────────────────────────────┬──────────────────────────┐
│  ▓ arch motif + grain         │   BrandMark (small)      │
│                               │                          │
│  Bricolage 40px               │   Welcome back           │
│  "Every project,              │   Sign in to your        │
│   one place."                 │   workspace.             │
│                               │                          │
│  Projects, boards, and        │   Email                  │
│  chat for your team.          │   [                    ] │
│                               │   Password               │
│  ── three short lines ──      │   [                    ] │
│                               │   Forgot password?       │
│  Kiln                         │   [    Sign in       ]   │
│                               │   New here? Create account│
└───────────────────────────────┴──────────────────────────┘
```

- **Login**: quiet, single column form, max-width 380, generous spacing, no card box around the form.
- **Signup** (differentiated): two real steps with a step indicator (allowed — it *is* a sequence): **1) Who you are** — name + usage role as selectable cards (Member / Manager / Admin, each with a plain one-line explanation); **2) Credentials** — email, password, confirm; then "Create workspace account". The step rail sits at the top of the form panel; the editorial panel stays fixed.
- Copy is plain and active; no slogans in the form itself.

### 9.2 App shell (`Layout.jsx`)

```
┌────────────┬──────────────────────────────────────────────┐
│ ◆ BrandMark│  Page header: title (h1) + subtitle + actions │
│            ├──────────────────────────────────────────────┤
│ ▸ Projects │                                              │
│ ▸ Chat     │  page content, gutter tokens, max-width 1400 │
│ ▸ Team     │                                              │
│            │                                              │
│ [user row] │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- 248px sidebar (72px collapsed rail with tooltips below `lg`), `bg-surface`, right border `border`.
- Nav items: Instrument Sans 15, active = moss-tinted fill pill + primary text (no side notches). Count badges where available.
- Bottom user row: `UserAvatar` + name/role → `DropdownMenu` (Profile [future], **Theme toggle**, Sign out). This is where the dark/light switch lives.
- Mobile: top bar (menu → `Sheet` nav, brand, theme toggle).

### 9.3 Projects

- `PageHeader`: "Projects" + count in `micro` + "New project" primary button.
- Grid `repeat(auto-fill, minmax(300px, 1fr))`, gap 20. Card: name (h3), 2-line description, footer = avatar stack + "updated" time; hover raises border to `primary/40` + `shadow-pop`; menu (⋯) → Edit / Delete via `DropdownMenu`; whole card links to the board.
- Create/Edit is a `Dialog`: name, description, member multi-select as an avatar checkbox list with filter (not the native `<select multiple>`).
- Delete via `AlertDialog`. Empty state: `EmptyState` with mini arch glyph, "No projects yet", CTA.
- Loading: skeleton cards. Errors: inline retry panel.

### 9.4 Kanban board

- Board header: project name (h1) + description + member avatars + "New task".
- Columns: 300px, recessed body (`background` on `surface` page), sticky header = status dot + title + count + add button. Status colors from tokens only.
- **Card anatomy: title, description clamp, footer (assignee avatar → dropdown, menu) — and nothing fake.** Priority/due-date/attachment chips appear only when the backend provides real fields (tracked in `plan2.md`). This is non-negotiable.
- Drag: source card at 40% opacity; overlay card rotated 1.5° with `shadow-pop`; hovered column ring `primary/40`. Drop persists status (existing optimistic PUT).
- Empty column: quiet "Drop tasks here" line. Empty board: `EmptyState` + CTA. Delete via card menu → `AlertDialog`.

### 9.5 Chat

- Header: channel name + member count + connection state (dot), sticky.
- Messages: grouped by sender within 5 minutes; 32px avatar; name + `micro` timestamp; date separators as a centered hairline with label; own messages right-aligned on moss-tinted bubble, others on `surface`.
- Composer: sticky bottom, auto-growing textarea, send icon button, `Enter to send` hint using `Kbd`.
- Empty state: "No messages yet — say hello." Loading: message skeletons. Ready for channels/DMs from `plan2.md` without layout change (left channel rail slot reserved).

### 9.6 Team setup ("Workspace")

- Active team as a distinct panel (not another identical card): name (h2), description, member count, "Set active" if inactive.
- Other teams as rows. Create team via `Dialog`.
- Members panel: avatar + name + role `Badge` + (future) actions. "Add member" dialog with two tabs — *Invite by email* / *Add existing user* — the latter with a filter input over the user list.
- Removes the `window.location.reload()` after switching teams (state update instead).

### 9.7 System surfaces

- **404**: arch motif + display headline + "Back to projects".
- **Error boundary**: calm fallback (surface panel, restart action).
- **Toasts**: every mutation reports success/failure; errors say what failed and what to do.
- **`/design` styleguide**: swatches, type scale, all component states, both themes side by side, forced-theme toggle. Not linked in nav; URL-accessible.

---

## 10. Accessibility & performance

- WCAG AA: 4.5:1 body text, 3:1 large text/UI; verified per theme in Phase 0 with a contrast script.
- Visible `focus-visible` ring on every interactive element (2px `ring`, 2px offset).
- All dialogs/sheets/menus via Radix (focus trap, Escape, ARIA); form fields get explicit labels and `aria-describedby` error text; icon-only buttons get `aria-label`.
- Skip-to-content link in the shell; kanban gets a keyboard "move to status" path in a later phase (flagged in `plan2.md`).
- Fonts: latin subset, variable, self-hosted, `font-display: swap`, preload of the display face; no CLS (sizes reserved).
- Grain/motion are CSS-only; no new animation library. Bundle impact ≈ fonts only.
- `prefers-reduced-motion` and `prefers-contrast` respected.

---

## 11. Phased execution

### Phase 0 — Foundations (no page work)
1. Install `@fontsource-variable/{bricolage-grotesque,instrument-sans,spline-sans-mono}`.
2. Create `styles/primitives.css`, `styles/theme.css`, `styles/utilities.css`; rewrite `App.css` (`@theme inline` mapping + base layer); update `index.html` (title "TeamCollab", Kiln favicon, theme script, dark default).
3. Build `ThemeProvider` + `ThemeToggle`; mount in `App.jsx`.
4. Write `DESIGN.md` (token contract) + `scripts/check-tokens.mjs` + `npm run lint:tokens`.
5. Scaffold `/design` and add new shadcn primitives (avatar, dropdown-menu, tooltip, alert-dialog, tabs, separator, skeleton, sheet, switch, checkbox, progress, scroll-area).
6. Contrast audit; tune token values.

**Accept:** app boots dark by default; toggle flips every screen; `lint:tokens` passes; `/design` renders tokens.

### Phase 1 — Shell + Auth (identity debut)
1. Re-skin all existing `ui/*` primitives to tokens; delete dead code and unused deps.
2. Rebuild `Layout.jsx` (sidebar, user menu, mobile sheet).
3. Rebuild Login + Signup per §9.1 (`AuthLayout`, split panel, arch, two-step signup).
4. Wire Sonner toasts into auth + shell actions.

**Accept:** both auth pages and the shell look finished in both themes; no raw palette classes; contrast verified.

### Phase 2 — Core work surfaces
1. Projects page + dialogs (§9.3).
2. Kanban board, cards, columns, drag states (§9.4); remove all fake data.
3. Team setup / members (§9.6).
4. `PageHeader`, `EmptyState`, `Skeleton`, `StatusBadge` applied consistently.

**Accept:** every list/board/empty/loading/error state designed in both themes; no `window.confirm`, no raw inputs.

### Phase 3 — Chat + system surfaces
1. Chat redesign (§9.5).
2. 404, error boundary, toast copy sweep.
3. Complete `/design` gallery.

**Accept:** chat matches identity; all system surfaces covered; keyboard/a11y pass.

### Phase 4 — Polish & enforcement
1. Grain, arch, fired edge placed exactly where specified (and nowhere else).
2. Motion audit (one settle per route; reduced motion verified).
3. Copy sweep (plain, active, consistent vocabulary).
4. Add `lint:tokens` to build/CI; update `DESIGN.md`; screenshot review dark+light; anti-slop checklist cleared.

**Accept:** `ui_renovation.md`'s §12 checklist is fully green; `README.md` screenshots updated.

---

## 12. Definition of done — anti-slop review checklist

- [ ] Every screen reviewed side by side in dark and light (`/design` + real pages)
- [ ] Zero raw palette classes or hex/rgba in app code (`lint:tokens` clean)
- [ ] No fake data anywhere; only real fields render
- [ ] No all-caps eyebrows, middot meta strings, decorative mono, gradient washes, side-tab accents
- [ ] One radius per role; one warm shadow language; fired edge on cards
- [ ] Type scale used as specified; Bricolage only for display roles; tabular numerals for data
- [ ] One settle animation per route; reduced motion verified
- [ ] Focus visible everywhere; AA contrast; dialogs focus-trapped; icon buttons labeled
- [ ] Empty, loading, and error states exist for every data surface
- [ ] No `window.confirm`, no `window.location.reload()`, no raw `<a>` for in-app nav
- [ ] Removing the `arch` motif entirely would not break any interior page (restraint test)

---

## 13. Decisions & open questions

| # | Decision | Default taken | Needs user |
|---|----------|---------------|------------|
| 1 | Wordmark | **Approved: renamed to "Kiln"** — rendered via a single `BrandMark` component | Resolved |
| 2 | Fonts | Self-hosted Fontsource variable fonts | No |
| 3 | shadcn semantics | `primary` = brand moss; `accent` = hover surface | No |
| 4 | Fake card metadata | Removed now; chips return when backend fields exist (`plan2.md`) | No |
| 5 | Styleguide access | `/design` always available, unlinked | No |
| 6 | Motion libs | None added; CSS transitions only | No |
| 7 | Rebrand scope | UI only; no backend/API work in this plan | No |

---

## 14. Skills installed for this work

| Skill | Location | Purpose |
|-------|----------|---------|
| `frontend-design` | `.opencode/skills/frontend-design/` | Anthropic's design-lead skill (Apache-2.0), used for all visual direction and self-critique |
| `kiln-design-system` | `.opencode/skills/kiln-design-system/SKILL.md` | Project-specific contract: identity rules, token discipline, anti-slop checklist, workflow |

Restart opencode once so both skills are discovered. After restart, any UI task will load them automatically.

---

## 15. What this plan does not do

- No backend, API, or data-model changes (the fake-data problem is solved by *removing* fake UI, not by adding fields).
- No new product features from `plan2.md` (notifications, file uploads, etc.) — the renovation deliberately leaves room for them.
- No component-library swap, no CSS framework change, no state-management introduction.
