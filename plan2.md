# TeamCollab — Feature Roadmap (Plan 2)

This document outlines additional features that can be built on top of the current Team Collaboration Platform, based on a full end-to-end review of the backend (`Express + MongoDB + Socket.io + Firebase Admin`) and frontend (`React + Vite + Tailwind + shadcn/ui + dnd-kit`).

Current feature set: Firebase auth, teams with roles (ADMIN/MANAGER/MEMBER), project CRUD with member assignment, Kanban board (todo / in-progress / done), team chat over Socket.io.

Priorities: **P0** = critical / security or core UX, **P1** = high value, **P2** = nice to have, **P3** = long-term.

---

## 1. Authentication & Security

- [ ] **Fix role escalation in `POST /api/auth/sync`** (P0) — the endpoint accepts `role` from the request body; strip mutable fields and only allow backend-assigned roles.
- [ ] **Authenticate Socket.io connections** (P0) — verify Firebase ID token in handshake, derive `senderId` from the token instead of trusting the client, and validate team membership before `joinTeamRoom`.
- [ ] **Scope message and task reads to team membership** (P0) — fix IDOR on `GET /api/messages/:teamId` and `GET /api/tasks?projectId=`.
- [ ] Forgot password flow with Firebase `sendPasswordResetEmail` (the login page already links to it). (P1)
- [ ] Email verification enforcement + UI banner for unverified users. (P1)
- [ ] Password change / account settings page. (P1)
- [ ] Rate limiting (`express-rate-limit`) on auth sync and message endpoints. (P1)
- [ ] Helmet + input sanitization on the API. (P2)
- [ ] Session/device management (list and revoke active sessions). (P3)
- [ ] 2FA / MFA via Firebase. (P3)

## 2. Team & Member Management

- [ ] Remove member from team. (P1)
- [ ] Change member role (promote/demote between ADMIN/MANAGER/MEMBER). (P1)
- [ ] Leave team & transfer ownership. (P1)
- [ ] Invitation flow: email invite with accept/reject, pending invite state, tokenized invite links. (P1)
- [ ] Team edit (rename, description) and delete. (P1)
- [ ] Dedicated Members page with search, role badges, and last-active info. (P1)
- [ ] Multiple teams per user: team switcher in the header, per-team roles (fix `User.teamId` single-team model). (P2)
- [ ] User profile page: display name, avatar upload, bio, job title. (P2)
- [ ] Organization/workspace layer above teams (departments, groups). (P3)
- [ ] Public team directory / discoverable teams. (P3)

## 3. Project Management

- [ ] Project detail page: overview, members, activity, stats. (P1)
- [ ] Project status (active / on hold / completed / archived), start & due dates. (P1)
- [ ] Project progress bar computed from task completion. (P1)
- [ ] Project search, filter, sort, and pagination. (P1)
- [ ] Project templates (predefined task lists per project type). (P2)
- [ ] Project members with per-project roles (owner, editor, viewer). (P2)
- [ ] Milestones and goals inside a project. (P2)
- [ ] Project archiving + restore instead of hard delete. (P2)
- [ ] Cascade delete tasks when a project/team is deleted (or soft-delete everything). (P1)
- [ ] Project files/attachments section. (P2)

## 4. Task & Kanban Enhancements

- [ ] **Task detail modal/page** with full description, assignee, priority, due date, and attachments (P0/P1 — the board currently shows hardcoded "High" priority, "2" attachments, and "Aug 10" due date).
- [ ] Real **priority** field (Low/Medium/High/Urgent) with colored badges and sorting. (P1)
- [ ] Real **due date** with overdue highlighting and reminders. (P1)
- [ ] **Task comments** with @mentions and timestamps. (P1)
- [ ] **Checklists / subtasks** with progress indicator. (P1)
- [ ] **Labels/tags** (backend, bug, design, etc.) with filters. (P2)
- [ ] **Kanban card reordering within a column** — persist a `position` field using `@dnd-kit/sortable` (the `SortableItem.jsx` component already exists but is unused). (P1)
- [ ] Custom columns per project (add/rename/reorder/delete) instead of the fixed three statuses. (P1)
- [ ] Task search, filter by assignee/priority/label/due date, and bulk actions. (P1)
- [ ] Task activity history / audit log (who changed what and when). (P2)
- [ ] Recurring tasks. (P2)
- [ ] Task dependencies (blocks / blocked by). (P3)
- [ ] Time tracking / estimates (log hours per task). (P3)
- [ ] Calendar view (month/week) and timeline/Gantt view of tasks. (P2)
- [ ] WIP limits and swimlanes on the board. (P3)

## 5. Real-time Collaboration

- [ ] **Live Kanban sync** — broadcast task create/update/delete/move over Socket.io so all viewers update instantly (currently only chat is realtime). (P1)
- [ ] **Live project/team updates** (new project, member added/removed). (P2)
- [ ] **Presence system** — online/offline/away status and list of active users per team. (P1)
- [ ] **Typing indicators** in chat. (P2)
- [ ] **Read receipts and unread message badges** per channel. (P1)
- [ ] **In-app notification center** (bell icon, dropdown, mark as read): task assigned to you, mentioned in comment, added to project/team. (P1)
- [ ] Browser push notifications (Web Push) for mentions/assignments. (P2)
- [ ] Email notifications digest (assigned tasks, mentions, due soon). (P2)
- [ ] Cursor/user presence on the Kanban board (who is viewing/editing). (P3)
- [ ] Live collaborative task description editing. (P3)

## 6. Chat Improvements

- [ ] **Channels** per project/team topic in addition to the single team room. (P1)
- [ ] **Direct messages** between team members. (P1)
- [ ] Message edit & delete (with "edited" marker). (P1)
- [ ] Emoji reactions on messages. (P2)
- [ ] Reply/thread support. (P2)
- [ ] File & image sharing with previews (see File Uploads section). (P1)
- [ ] Emoji picker and GIF support. (P2)
- [ ] Message search. (P1)
- [ ] Pagination / infinite scroll for message history (currently loads all at once). (P1)
- [ ] Auto-scroll to latest, date separators, grouped consecutive messages. (P1)
- [ ] Link previews (Open Graph unfurling). (P2)
- [ ] Voice messages and video/audio calls (WebRTC). (P3)

## 7. File Uploads & Attachments

- [ ] Integrate cloud storage (Firebase Storage, S3, or Cloudinary). (P1)
- [ ] Attach files to tasks and projects. (P1)
- [ ] Attach images/files in chat. (P1)
- [ ] Avatar uploads for user profiles. (P2)
- [ ] File type/size validation, virus scanning hook, storage quotas. (P2)
- [ ] Drag-and-drop upload UI with progress bars. (P2)

## 8. Notifications & Communication

- [ ] Notification model + REST endpoints (list, mark read, unread count). (P1)
- [ ] Notification preferences per user (email, push, in-app toggles). (P2)
- [ ] @mention support across comments, task descriptions, and chat. (P1)
- [ ] Daily/weekly summary emails. (P3)
- [ ] Slack / Discord webhook integration (task created, status changed). (P2)
- [ ] Calendar integrations (Google Calendar, Outlook) for due dates. (P3)
- [ ] GitHub / GitLab integration: link commits/PRs to tasks. (P3)

## 9. Analytics & Reporting

- [ ] Team dashboard: task counts by status/assignee, completion rate, overdue count. (P1)
- [ ] Burndown / velocity charts per project. (P2)
- [ ] Workload view — tasks per member to balance assignments. (P2)
- [ ] Personal dashboard: "my tasks", upcoming deadlines, recent activity. (P1)
- [ ] Time-in-status reports (cycle time). (P3)
- [ ] Export reports/projects to CSV/PDF. (P2)

## 10. UI/UX Polish

- [ ] **Toast feedback** for all CRUD actions using the already-installed Sonner (`Toaster` is mounted but never used) + error states on failed loads. (P1)
- [ ] **Dark/light theme toggle** — dark theme variables and `next-themes` already exist but there is no `ThemeProvider`; the UI is currently hardcoded dark. (P1)
- [ ] Replace all `window.confirm` delete prompts with shadcn `AlertDialog`. (P1)
- [ ] Replace the hand-rolled project modal with the shadcn `Dialog` (focus trap, Escape, ARIA). (P1)
- [ ] 404 / catch-all route + React error boundary. (P1)
- [ ] Loading skeletons instead of bare spinners. (P2)
- [ ] Replace hardcoded URLs in `api.js` / `socket.js` with `VITE_API_URL` / `VITE_SOCKET_URL` env vars (defined in `.env` but ignored). (P0)
- [ ] Fix branding: `index.html` still says "Vite + React" and uses the Vite favicon. (P1)
- [ ] Use react-router `Link` for login/signup navigation (currently full page reloads) and remove `window.location.reload()` after switching teams. (P2)
- [ ] Mobile experience: bottom navigation, touch-friendly DnD (`TouchSensor`), responsive chat height. (P2)
- [ ] Keyboard shortcuts (create task, search, navigate board). (P2)
- [ ] Command palette (Cmd/Ctrl+K) for quick navigation and search. (P2)
- [ ] Accessibility pass: `aria-label`s on icon buttons, keyboard-operable Kanban (move task without drag), focus management. (P2)
- [ ] Empty states, onboarding tour, and sample data for new users. (P2)
- [ ] Internationalization (i18n) support. (P3)
- [ ] PWA: installable app, offline cache, background sync. (P2)

## 11. Backend Architecture & Infrastructure

- [ ] **Add DB indexes** on `Message.teamId`, `Project.teamId`, `Task.projectId`, `Task.assignedTo`, `Team.members`. (P0)
- [ ] Pagination + query filters on every list endpoint (projects, tasks, messages, users). (P1)
- [ ] Centralized error handler + 404 handler + structured logging (morgan/pino). (P1)
- [ ] Health check endpoint `GET /health` for uptime monitors. (P1)
- [ ] Remove the accidental `/api/users` double-mount of `teamRoutes` and fix the route surface. (P1)
- [ ] Fix `listMyTeams` / `setActiveTeam` so non-admin members can list and select their teams. (P1)
- [ ] Consolidate `Team.members` and `User.teamId` into one source of truth (or sync them transactionally). (P1)
- [ ] Mongo transactions for multi-document operations (team creation, cascade deletes). (P2)
- [ ] Soft deletes + trash/restore for projects, tasks, messages. (P2)
- [ ] Caching layer (Redis) for hot reads; Redis adapter for Socket.io to support multiple backend instances. (P2)
- [ ] Background job queue (BullMQ) for emails, notifications, reminders. (P2)
- [ ] API versioning (`/api/v1`) and OpenAPI/Swagger docs. (P2)
- [ ] Dockerize backend + docker-compose for local dev. (P2)
- [ ] CI/CD pipelines (GitHub Actions): lint, test, build, deploy. (P1)
- [ ] `.env.example` files for both apps. (P1)

## 12. Quality, Testing & Developer Experience

- [ ] Backend tests: Jest + Supertest for routes/controllers; mongodb-memory-server for isolation. (P1)
- [ ] Frontend tests: Vitest + React Testing Library; Playwright E2E for auth, kanban drag, chat. (P1)
- [ ] ESLint + Prettier on backend (frontend already has ESLint 9). (P1)
- [ ] TypeScript migration (shadcn components are already `.tsx`) or at least JSDoc types. (P2)
- [ ] Storybook for UI components. (P3)
- [ ] Seed script for demo data. (P2)
- [ ] Remove dead code: `react-beautiful-dnd`, `@dnd-kit/modifiers`, unused `SortableItem.jsx`, `ExampleShadcn.jsx`, debug console logs, broken `KanbanBoardWrapper`. (P1)

## 13. Integrations & Advanced Features

- [ ] Global search across projects, tasks, messages, and members (P1)
- [ ] Automation rules ("when task moves to Done, notify project owner"). (P3)
- [ ] Custom fields on tasks. (P3)
- [ ] Public shareable read-only board links. (P2)
- [ ] Guest/anonymous access for external collaborators. (P2)
- [ ] AI assistant: summarize chat/threads, suggest task assignments, auto-generate subtasks from a description, smart search. (P3)
- [ ] Zapier / Make.com integration. (P3)
- [ ] Desktop app (Electron/Tauri). (P3)
- [ ] Native mobile apps (React Native). (P3)

---

## Suggested Release Phases

### Phase 1 — Security & Stability (P0)
Fix auth sync role escalation, Socket.io auth, IDOR on messages/tasks, env-based API/socket URLs, DB indexes.

### Phase 2 — Core Product Depth (P1)
Task detail modal with priority/due date/comments/checklists, live Kanban sync, notifications (in-app), chat channels + unread badges, member management (roles/remove/leave/invites), toasts + theme toggle, project detail page, dashboard, pagination, tests + CI.

### Phase 3 — Collaboration & Polish (P2)
File uploads, direct messages, presence + typing, emoji reactions, presence-aware board, analytics charts, calendar view, mobile/PWA, error boundaries, skeletons, a11y pass.

### Phase 4 — Scale & Integrations (P3)
Multi-team workspaces, automations, AI features, Slack/GitHub/Calendar integrations, real-time collaborative editing, voice/video, native apps.
