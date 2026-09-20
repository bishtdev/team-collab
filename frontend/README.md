# Kiln — Frontend

React 18 + Vite + Tailwind CSS v4 + Redux Toolkit + shadcn/ui. Dark-first, token-driven UI built on the Kiln design system.

## Scripts

```bash
npm run dev          # dev server on :5173
npm run build        # production build to dist/
npm run preview      # preview the production build
npm run lint         # eslint
npm run lint:tokens  # fails on raw palette classes, window.confirm, or page reloads
```

## Design system

- `DESIGN.md` — the token contract: color, type, shape, motion, rules.
- `src/styles/primitives.css` — raw ramps (umber, moss, gilt, rust, teal). Never reference from components.
- `src/styles/theme.css` — semantic tokens for light (`:root`) and dark (`.dark`).
- `src/App.css` — Tailwind entry and `@theme inline` map.
- `/design` route — live gallery of every token and primitive in both themes.
- Theme: dark by default; Dark / Light / System in the account menu. Persisted in `localStorage` under `kiln-theme`.

Full plan: `../ui_renovation.md`.

## Environment

`.env` (see root README):

```env
VITE_FIREBASE_API_KEY=...
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
