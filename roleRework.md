# Role System Rework — Implementation Plan

> Goal: move from open-signup + multi-admin drift to delegated RBAC with invite-only control.
> Target: `OWNER > ADMIN > MANAGER > MEMBER (+ VIEWER)` + `INVITE_ONLY` mode + single source of truth.

## 0. Context / Why

Current state (audited Sep 2026):

- `backend/models/User.js`: `role` cached copy + `teamId` (active team only), default `MEMBER`.
- `backend/models/Team.js`: `adminId` + `members[{userId, role}]` — authoritative but duplicated.
- `backend/middlewares/role.js` (`checkRole`): resolves via `req.user.teamId` -> `adminId` priority, else `members[].role`.
- `backend/routes/auth.js` (`POST /api/auth/sync`): fixed — only accepts `name`, upserts `MEMBER`.
- `backend/controllers/teamController.js:createTeam`: any authed user can become `ADMIN` of own team.
- `backend/controllers/teamController.js:addUserToTeam`: `ADMIN|MANAGER` can direct-insert by `userId|email`, including `User.create()` orphan (no Firebase, no token).
- `frontend/src/pages/Signup.jsx` + `App.jsx:/signup` + `/setup-team`: open signup -> self-create team.
- `frontend/src/hooks/usePermissions.js`: frontend-only map from `user.role`.
- No `Invite` model, no token, no email. Only TODO in `plan2.md`.

Target properties (industry standard — Slack/Linear/GitHub pattern):

- One membership table is truth. No `adminId` vs `members.role` vs `User.role` drift.
- Least privilege, default deny, server-enforced.
- Invite lifecycle: hashed token, expiry, single-use, revocable.
- Config-gated strictness: `INVITE_ONLY=true`, `ALLOW_TEAM_CREATION=owner|admin-only` gives "one admin handles everything" without hard-coding single-admin bottleneck.
- Backup owner (bus-factor >= 2).

## 1. Target Architecture

### 1.1 Role hierarchy

```
OWNER (platform, seeded, 1-2) > ADMIN (per-team, manages people) > MANAGER (manages work) > MEMBER (contributes) > VIEWER (read-only, optional P2)
```

### 1.2 Permission matrix (enforced in `checkRole` + resource checks)

| Action | OWNER | ADMIN | MANAGER | MEMBER |
|---|---|---|---|---|
| Invite / remove / change role | ✅ | ✅ | ❌ | ❌ |
| Create team | ✅ | ❌* | ❌ | ❌ |
| Create/edit project | ✅ | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ | ❌ | ❌ |
| Create/edit/delete task | ✅ | ✅ | ✅ | ❌ |
| Comment / subtask / chat | ✅ | ✅ | ✅ | ✅ |

`*` gated by `ALLOW_TEAM_CREATION`.

### 1.3 Data model (after)

```js
// User — NO role, NO teamId cache (or kept as lastActiveTeamId only, never used for authz)
User { _id, email(unique, lowercase), name, photoUrl?, lastActiveTeamId? }

// Team.members[] — SOLE source of truth for authorization
Team { _id, name, description, ownerId, members: [{ userId, role: ADMIN|MANAGER|MEMBER|VIEWER, joinedAt }] }

// New
Invite {
  email, teamId, role: MANAGER|MEMBER|VIEWER (never OWNER via invite, ADMIN only by OWNER),
  tokenHash (sha256, unique), status: pending|accepted|revoked|expired,
  expiresAt (default +48h), invitedBy, acceptedUserId?, createdAt
}
```

Indexes: `Invite.tokenHash unique`, `Invite {email, teamId, status}`, `Team.members.userId`, `Team.ownerId`.

### 1.4 Config / env

```
ADMIN_EMAILS=you@company.com,backup@company.com   # seeded OWNERs
INVITE_ONLY=true                                   # false = allow open signup (dev)
ALLOW_TEAM_CREATION=owner                          # owner | admin | any (legacy)
INVITE_TTL_HOURS=48
FRONTEND_URL=https://...
SMTP_* or RESEND_API_KEY=...
```

### 1.5 API surface (new / changed)

```
POST   /api/invites                    OWNER|ADMIN — {email, teamId, role} -> {inviteLink}
GET    /api/invites/:token/validate    public (rate-limited) -> {email, teamName, role, expiresAt}
POST   /api/invites/:token/accept      public+Firebase token -> joins team, marks accepted
POST   /api/invites/:id/revoke         OWNER|ADMIN
GET    /api/invites?teamId=...         OWNER|ADMIN — list pending
PATCH  /api/auth/sync                  changed — if INVITE_ONLY and not OWNER and no pending invite for email -> 403 INVITE_REQUIRED
POST   /api/teams                      changed — gated by ALLOW_TEAM_CREATION
DEPRECATE POST /api/teams/:teamId/add-user -> replaced by invites (keep 1 release as 410 + migration note)
```

Invite link: `${FRONTEND_URL}/invite/:rawToken` (raw only in email, only hash in DB).

## 2. Phased Plan

### Phase 0 — Decisions + prep (0.5d)

- [ ] Confirm: single workspace (`Kiln`) vs multi-team SaaS? Default: single workspace, multi-team, one OWNER set.
- [ ] Confirm roles to ship V1: `OWNER, ADMIN, MANAGER, MEMBER` (`VIEWER` deferred to P2 unless needed).
- [ ] Confirm email provider: Resend (recommended) vs Nodemailer/SMTP vs Firebase Extension.
- [ ] Freeze permission matrix above with stakeholder sign-off.
- [ ] Add `.env.example` entries (backend + frontend `VITE_INVITE_ONLY` flag for UI copy).

Files: `.env.example`, `roleRework.md` (this file).

### Phase 1 — Backend foundation: model + seed + middleware (1-2d)

- [ ] `backend/models/Invite.js` — schema + indexes + TTL + `compareToken` helper (sha256, timing-safe).
- [ ] `backend/scripts/seed-admin.js` — upsert `ADMIN_EMAILS` users, ensure owner team exists, add as `OWNER`/`ADMIN` in `members[]`. Idempotent, runnable via `npm run seed:admin`.
- [ ] `backend/middlewares/platform.js` — `requireOwner`, `requireTeamRole([...])` (replaces ad-hoc `userIsAdminOfTeam` checks). Keep `checkRole` as compat wrapper that reads `Team.members` only (drop `adminId` priority, drop `User.role` reliance).
- [ ] `backend/config/flags.js` — central `INVITE_ONLY`, `ALLOW_TEAM_CREATION`, `INVITE_TTL_HOURS` loader + tests.
- [ ] Unit tests: token hash, expiry, role resolution.

Accept: `npm run seed:admin` creates owner, `requireOwner` blocks non-owner.

### Phase 2 — Invite API + auth gate (2-3d)

- [ ] `backend/controllers/inviteController.js`:
  - `createInvite` — validate email/role/team, prevent duplicate pending, hash token with `crypto.randomBytes(32)`, store hash, return raw link once, audit `Activity.create({action:'invite_created'})`.
  - `validateInvite` — public, rate-limited, checks hash/expiry/status, returns safe metadata (no token echo).
  - `acceptInvite` — `verifyFirebaseToken` + email match (decoded email === invite email), `User.findOneAndUpdate` upsert, `$addToSet` into `Team.members`, mark `accepted`, set `lastActiveTeamId`.
  - `revokeInvite`, `listInvites`.
- [ ] `backend/routes/inviteRoutes.js` + mount in `server.js` (`/api/invites`). Apply `generalLimiter` + stricter `inviteLimiter` (10/hr/IP) on validate/accept.
- [ ] `backend/services/mailer.js` — Resend/Nodemailer abstraction + `sendInviteEmail({to, link, teamName, role})`. Log link in dev, send in prod. Queue-ready (BullMQ later).
- [ ] Patch `routes/auth.js:sync` — if `INVITE_ONLY=true` and email not in `ADMIN_EMAILS` and no `accepted|pending` invite -> `403 {code:'INVITE_REQUIRED'}`. Do NOT auto-create team.
- [ ] Tests (Supertest + mongodb-memory-server): create -> validate -> accept -> reuse fails -> expired fails -> revoked fails -> wrong-email fails.

Accept: end-to-end invite works via curl without frontend.

### Phase 3 — Lockdown + single-source migration (1-2d)

- [ ] Gate `POST /api/teams` — check `ALLOW_TEAM_CREATION`: `owner` => `requireOwner`, `admin` => `requireTeamRole([OWNER,ADMIN])`. Update `validators/teamValidator.js` if needed.
- [ ] Deprecate `addUserToTeam` — return `410 {error:'Use invites', migrateTo:'/api/invites'}` behind flag `LEGACY_ADD_USER=false` (default false after release). Remove `User.create({email})` orphan path entirely.
- [ ] Tighten `changeMemberRole`, `removeMember`, `transferOwnership`:
  - Only `OWNER|ADMIN`, never allow self-demote last OWNER, never allow `MANAGER` to promote to `ADMIN` (only `OWNER` can grant `ADMIN`).
  - Old admin on transfer -> `MANAGER` (keep) + audit + socket emit (keep existing `socketEmitter` calls).
- [ ] Migration `scripts/migrate-roles-to-members.js`:
  - For each `Team`: ensure `ownerId` set (fallback `adminId`), ensure `ownerId` + `adminId` present in `members[]` with correct role, dedupe, drop reliance on `User.role`/`User.teamId` for authz (keep `lastActiveTeamId` for UX only).
  - Backfill existing `ADMIN_EMAILS` as `OWNER`.
  - Dry-run + apply modes, prints diff.
- [ ] Update `middlewares/role.js` to read only `Team.members` (remove `adminId` fast-path, remove `req.user.teamId` gate in favor of `teamId` param / body + membership check). Update `projectController`, `taskController:verifyProjectAccess`, `messageRoutes`, `userRoutes/team` to use new helper.
- [ ] Fix socket `joinTeamRoom` in `server.js` — verify membership in *requested* team (`Team.exists({_id:teamId,'members.userId':user._id})`), not just `activeTeamId` equality.

Accept: no code path reads `User.role` for authz; `rg "req.user.role" backend` returns only UX/audit hits.

### Phase 4 — Frontend (2d)

- [ ] `src/pages/InviteAccept.jsx` — route `/invite/:token`: calls `GET /invites/:token/validate`, shows team/role/expiry, Firebase signup/signin form (email locked), then `POST /invites/:token/accept`, `refreshUser()`, navigate `/projects`. Handles `expired|revoked|invalid` states with resend-request CTA.
- [ ] `App.jsx` — add `/invite/:token` public route. If `VITE_INVITE_ONLY=true`, `/signup` shows "Invite required — ask your admin" + link to request access (or redirect to `/invite` entry that asks for token).
- [ ] `TeamSetup.jsx` — hide `CreateTeamModal` button unless `role in [OWNER,ADMIN]` (via `usePermissions`), replace `AddUserToTeamModal` with `InviteUserModal` (email + role select + copy-link + resend/revoke list). Keep old modal behind flag for 1 release if needed.
- [ ] `hooks/usePermissions.js` — extend: `role` from `activeTeam membership` (from `teamsSlice`), add `isOwner`, `canInvite`, `canManageMembers`, `canCreateTeam`. No behavior change for tasks/projects matrix.
- [ ] `context/AuthContext.jsx:syncUserWithBackend` — surface `INVITE_REQUIRED` error code to UI (friendly message).
- [ ] `services/teamService.js` + `features/teams/teamsSlice.js` — add `inviteUser, validateInvite, acceptInvite, revokeInvite, listInvites` thunks.

Accept: admin can invite from UI, new user completes flow without ever seeing `/setup-team` team-creation.

### Phase 5 — Hardening + ops (1d, parallelizable)

- [ ] Rate limits: `inviteLimiter`, `authLimiter` already exists — verify.
- [ ] Email deliverability: SPF/DKIM, dev inbox preview, prod template (plain + branded).
- [ ] Audit: `Activity {action: invite_created|accepted|revoked|role_changed|member_removed}` already partially exists — ensure all invite paths log `actorId, teamId, targetEmail`.
- [ ] Socket events: `user:invited`, `user:role-updated`, `user:removed-from-team` — keep existing, add invited.
- [ ] Helmet + sanitize (already in `plan2.md` P1) — at least enable on `/api/invites`.
- [ ] Docs: update `README.md` + `.env.example` + runbook for "add admin / revoke invite / reseed owner".

### Phase 6 — Test, migrate, rollout (1d)

- [ ] Backend: Jest+Supertest — invite lifecycle, `sync` gate, team-creation gate, last-owner protection.
- [ ] Frontend: Vitest — `InviteAccept` states, `usePermissions` matrix; Playwright E2E — invite -> signup -> kanban visible.
- [ ] Staging migration: backup DB, run `migrate-roles-to-members.js --dry-run`, then `--apply`, then `seed-admin.js`, smoke test.
- [ ] Prod rollout: deploy backend first (with `LEGACY_ADD_USER=true` for 1d), then frontend, then flip `INVITE_ONLY=true`, `LEGACY_ADD_USER=false`.
- [ ] Rollback: env flip back + previous image tag; invites are additive so safe.

## 3. File-by-File Change List

```
backend/models/Invite.js                NEW
backend/services/mailer.js              NEW
backend/controllers/inviteController.js NEW
backend/routes/inviteRoutes.js          NEW
backend/middlewares/platform.js         NEW (requireOwner, requireTeamRole)
backend/config/flags.js                 NEW
backend/scripts/seed-admin.js           NEW
backend/scripts/migrate-roles-to-members.js NEW
backend/middlewares/role.js             EDIT — members-only resolution
backend/routes/auth.js                  EDIT — INVITE_REQUIRED gate
backend/controllers/teamController.js   EDIT — gate createTeam, deprecate addUser, tighten role changes
backend/routes/teamRoutes.js            EDIT — wire new guards, mount invite routes via server.js
backend/server.js                       EDIT — mount /api/invites, fix joinTeamRoom membership check
backend/models/User.js                  EDIT — deprecate role/teamId for authz (keep lastActiveTeamId)
backend/models/Team.js                  EDIT — add ownerId, joinedAt, Invite ref index note
frontend/src/pages/InviteAccept.jsx     NEW
frontend/src/components/modals/InviteUserModal.jsx NEW (replaces AddUserToTeamModal)
frontend/src/App.jsx                    EDIT — /invite/:token route
frontend/src/pages/Signup.jsx           EDIT — invite-required state
frontend/src/pages/TeamSetup.jsx        EDIT — hide create, use invite modal
frontend/src/hooks/usePermissions.js    EDIT — isOwner/canInvite from membership
frontend/src/context/AuthContext.jsx    EDIT — surface INVITE_REQUIRED
frontend/src/services/teamService.js    EDIT — invite API fns
frontend/src/features/teams/teamsSlice.js EDIT — invite thunks
```

## 4. Acceptance Criteria (V1 done)

- [ ] No valid invite + non-owner email -> `POST /api/auth/sync` returns `403 INVITE_REQUIRED`.
- [ ] Admin creates invite -> email/link works -> `validate` ok -> `accept` joins correct team with correct role, token single-use.
- [ ] Expired (>48h) / revoked / wrong-email tokens rejected with distinct codes.
- [ ] Non-admin cannot `POST /teams` (when `ALLOW_TEAM_CREATION=owner`), cannot invite, cannot change roles.
- [ ] No orphan `User.create({email})` path remains; `rg "User.create" backend/controllers/team*` clean.
- [ ] `User.role` no longer used for authz; all guards read `Team.members`.
- [ ] E2E: invite -> signup -> projects -> kanban -> chat works for MEMBER with least privilege.
- [ ] Seed + migration scripts idempotent, dry-run clean on staging dump.

## 5. Risks / Mitigations

- Lockout (single OWNER leaves) -> seed 2 OWNERs, document break-glass + `seed-admin.js` re-run via DB access.
- Existing users without invite blocked after flip -> migration backfills `accepted` invites for current members; grace period with `INVITE_ONLY=false` on staging.
- Email fails -> dev logs link to console, prod alert + admin copy-link fallback in UI.
- Token leak -> 32-byte random, sha256 at rest, single-use, short TTL, rate-limited validate.

## 6. Estimate

- Backend (Ph1-3): 4-6d
- Frontend (Ph4): 2d
- Hardening + tests + rollout (Ph5-6): 2d
- Total: ~8-10d solo, ~5d with parallel frontend/backend.

## 7. Next Step

1. Approve matrix + `VIEWER` scope + mail provider.
2. Implement Phase 1+2 first (invite API behind flag, no breaking change).
3. Then flip gates (Phase 3+4) in one release.

---
*Companion docs: `plan2.md` (P0 security, P1 invites), `ui_renovation.md` (Add-member dialog).*
