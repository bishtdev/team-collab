// controllers/inviteController.js
// Full invite lifecycle: create -> validate -> accept -> revoke/list.
// Org-aware (multi-company): invites carry orgId (+ optional teamId).
// - Door 2 (join): token binds to ONE org; accept joins Org.members (+Team if teamId).
// - Token security: raw token returned ONCE, DB stores only sha256(raw).
const crypto = require('crypto');
const Invite = require('../models/Invite');
const Org = require('../models/Org');
const Team = require('../models/Team');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { flags, isOwnerEmail } = require('../config/flags');
const { sendInviteEmail } = require('../services/mailer');
const { getRoleInOrg } = require('../middlewares/orgScope');
const { addToOrg } = require('../services/membership');

const buildLink = (rawToken) => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/invite/${rawToken}`;
};

// POST /api/invites — OWNER|ADMIN of the ORG creates an invite.
// Body: { email, orgId, teamId?, role: MEMBER|MANAGER }
// teamId optional: org-level invite joins Org only; team invite joins Org + Team.
exports.createInvite = async (req, res) => {
  try {
    const { email, orgId, teamId, role = 'MEMBER' } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const normEmail = String(email).toLowerCase().trim();
    if (!['MEMBER', 'MANAGER'].includes(role)) {
      return res.status(400).json({ error: 'Invite role must be MEMBER or MANAGER (ADMIN granted only by OWNER via role-change)' });
    }
    // Resolve org: explicit orgId, or the workspace of the target team.
    let team = null;
    if (teamId) {
      team = await Team.findById(teamId).select('name orgId').lean();
      if (!team) return res.status(404).json({ error: 'Team not found' });
      if (!team.orgId) {
        return res.status(400).json({ error: 'Team is not bound to a workspace' });
      }
    }
    const resolvedOrgId = orgId || team?.orgId;
    if (!resolvedOrgId) return res.status(400).json({ error: 'orgId required (or a teamId bound to a workspace)' });
    const org = await Org.findById(resolvedOrgId).select('name members').lean();
    if (!org) return res.status(404).json({ error: 'Workspace not found' });
    // Team must belong to the SAME workspace — never trust a client-supplied pair.
    if (team && String(team.orgId) !== String(resolvedOrgId)) {
      return res.status(400).json({ error: 'Team does not belong to this workspace' });
    }

    // Authz: break-glass OR OWNER|ADMIN of THIS org. Org role is the only authority.
    const callerIsBreakGlass = isOwnerEmail(req.user.email);
    if (!callerIsBreakGlass && !['OWNER', 'ADMIN'].includes(getRoleInOrg(org, req.user._id))) {
      return res.status(403).json({ error: 'Only workspace OWNER or ADMIN can invite' });
    }

    // Prevent duplicate pending invite (idempotent UX).
    const dupQuery = { email: normEmail, orgId: resolvedOrgId, status: 'pending' };
    if (teamId) dupQuery.teamId = teamId;
    const existing = await Invite.findOne(dupQuery);
    if (existing && existing.expiresAt > new Date()) {
      return res.status(409).json({ error: 'Pending invite already exists for this email' });
    }

    // Generate raw token, store only its hash.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = Invite.hashToken(rawToken);
    const invite = await Invite.create({
      email: normEmail,
      orgId: resolvedOrgId,
      ...(teamId ? { teamId } : {}),
      role,
      tokenHash,
      expiresAt: new Date(Date.now() + flags.INVITE_TTL_HOURS * 3600 * 1000),
      invitedBy: req.user._id,
    });

    await Activity.create({
      taskId: null, actorId: req.user._id, action: 'invite_created',
      details: { orgId: resolvedOrgId, teamId, email: normEmail, role, inviteId: invite._id },
    });

    const link = buildLink(rawToken);
    // Fire-and-forget email (don't block response on SMTP slowness).
    sendInviteEmail({ to: normEmail, link, teamName: team?.name || org.name, role, invitedByName: req.user.name }).catch(() => {});
    console.log(`[INVITE] ${normEmail} -> ${org.name}${team ? '/' + team.name : ''} as ${role}: ${link}`);

    // Raw token returned once so admin UI can copy-link as fallback if email fails.
    res.status(201).json({ invite, inviteLink: link });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invite', details: err.message });
  }
};

// GET /api/invites/:token/validate — public, rate-limited. Returns safe metadata.
exports.validateInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ tokenHash: Invite.hashToken(req.params.token) })
      .populate('teamId', 'name')
      .populate('orgId', 'name slug');
    if (!invite) return res.status(404).json({ code: 'INVALID', error: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(410).json({ code: 'ACCEPTED', error: 'Already accepted' });
    if (invite.status === 'revoked') return res.status(410).json({ code: 'REVOKED', error: 'Invite revoked. Ask admin for a new one.' });
    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      return res.status(410).json({ code: 'EXPIRED', error: 'Invite expired. Ask admin for a new one.' });
    }
    res.json({
      email: invite.email,
      role: invite.role,
      orgId: invite.orgId?._id || invite.orgId,
      orgName: invite.orgId?.name,
      orgSlug: invite.orgId?.slug,
      teamName: invite.teamId?.name,
      teamId: invite.teamId?._id || invite.teamId,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Validate failed', details: err.message });
  }
};

// POST /api/invites/:token/accept — Firebase-authed. Email must match invite.
// Body: { name? } — name used if user record is new.
exports.acceptInvite = async (req, res) => {
  try {
    // req.firebaseUser set by verifyFirebaseToken; req.user set by authenticate if they already sync'd.
    // Accept must work for brand-new users too, so we read email from Firebase token.
    const fbUser = req.firebaseUser;
    const fbEmail = (fbUser?.email || req.user?.email || '').toLowerCase();
    if (!fbEmail) return res.status(401).json({ error: 'No Firebase email' });
    // The invite binds by email, so an unverified address must not be able to claim it.
    if (fbUser && fbUser.email_verified === false) {
      return res.status(403).json({ code: 'EMAIL_UNVERIFIED', error: 'Verify your email before accepting.' });
    }

    const invite = await Invite.findOne({ tokenHash: Invite.hashToken(req.params.token) });
    if (!invite) return res.status(404).json({ code: 'INVALID', error: 'Invite not found' });
    // Distinct, correct codes (expiry is checked BEFORE the generic status branch).
    if (invite.status && invite.status !== 'pending') {
      return res.status(410).json({ code: invite.status.toUpperCase(), error: `Invite ${invite.status}` });
    }
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'expired';
      await invite.save();
      return res.status(410).json({ code: 'EXPIRED', error: 'Invite expired. Ask admin for a new one.' });
    }
    if (invite.email !== fbEmail) {
      return res.status(403).json({ code: 'EMAIL_MISMATCH', error: `Invite is for ${invite.email}. Sign in with that email.` });
    }

    // Upsert user (sync equivalent, scoped to invite).
    const name = req.body.name || fbUser?.name || fbEmail.split('@')[0];
    const user = await User.findOneAndUpdate(
      { email: fbEmail },
      { $setOnInsert: { email: fbEmail, role: invite.role === 'MANAGER' ? 'MANAGER' : 'MEMBER' }, $set: { name } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Consume the token atomically BEFORE any membership write → true single-use.
    // Two concurrent accepts: only one passes this conditional update.
    const consumed = await Invite.findOneAndUpdate(
      { _id: invite._id, status: 'pending', expiresAt: { $gt: new Date() } },
      { $set: { status: 'accepted', acceptedUserId: user._id, acceptedAt: new Date() } },
      { new: true }
    );
    if (!consumed) return res.status(410).json({ code: 'ACCEPTED', error: 'Invite already used' });

    // Join the workspace. add-if-absent ONLY — never overwrite an existing role,
    // so an invite can never demote a current ADMIN/OWNER.
    await addToOrg(invite.orgId, user._id, invite.role);

    // Every member needs at least one team: project/task routes and socket rooms
    // are team-scoped, so an org-level invite (no teamId) must still land the user
    // in one — otherwise they can see the workspace but do nothing inside it.
    let teamId = invite.teamId || null;
    if (!teamId) {
      const firstTeam = await Team.findOne({ orgId: invite.orgId })
        .sort({ createdAt: 1 })
        .select('_id')
        .lean();
      teamId = firstTeam?._id || null;
    }
    if (teamId) {
      await Team.updateOne(
        { _id: teamId, 'members.userId': { $ne: user._id } },
        { $push: { members: { userId: user._id, role: invite.role } } }
      );
    }

    // Pointers for UX only (never authz). Only adopt the team when the user has
    // none — accepting a second invite must not yank them out of their active one.
    user.lastActiveOrgId = invite.orgId;
    if (teamId && !user.teamId) user.teamId = teamId;
    user.role = invite.role === 'MANAGER' ? 'MANAGER' : 'MEMBER'; // cached copy for old UI
    await user.save();

    await Activity.create({
      taskId: null, actorId: user._id, action: 'invite_accepted',
      details: { orgId: invite.orgId, teamId, email: fbEmail, role: invite.role },
    });

    res.json({ message: 'Invite accepted', user, orgId: invite.orgId, teamId, role: invite.role });
  } catch (err) {
    res.status(500).json({ error: 'Accept failed', details: err.message });
  }
};

// POST /api/invites/:id/revoke — OWNER|ADMIN of the invite's org.
exports.revokeInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    const callerIsBreakGlass = isOwnerEmail(req.user.email);
    if (!callerIsBreakGlass) {
      // Org role is the only authority (invite.orgId is required).
      const org = await Org.findById(invite.orgId).select('members').lean();
      if (!['OWNER', 'ADMIN'].includes(getRoleInOrg(org, req.user._id))) {
        return res.status(403).json({ error: 'Only workspace OWNER or ADMIN can revoke' });
      }
    }
    invite.status = 'revoked';
    await invite.save();
    await Activity.create({
      taskId: null, actorId: req.user._id, action: 'invite_revoked',
      details: { orgId: invite.orgId, teamId: invite.teamId, email: invite.email },
    });
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    res.status(500).json({ error: 'Revoke failed', details: err.message });
  }
};

// GET /api/invites?orgId=xxx[&teamId=yyy] — list for admin UI.
exports.listInvites = async (req, res) => {
  try {
    const { orgId, teamId } = req.query;
    // Resolve workspace: explicit orgId, or the workspace of the target team.
    let resolvedOrgId = orgId;
    if (!resolvedOrgId && teamId) {
      const t = await Team.findById(teamId).select('orgId').lean();
      if (!t) return res.status(404).json({ error: 'Team not found' });
      resolvedOrgId = t.orgId;
    }
    if (!resolvedOrgId) return res.status(400).json({ error: 'orgId required' });

    // Authz ALWAYS runs — no org-less fallback path (that was the IDOR).
    const callerIsBreakGlass = isOwnerEmail(req.user.email);
    if (!callerIsBreakGlass) {
      const org = await Org.findById(resolvedOrgId).select('members').lean();
      if (!['OWNER', 'ADMIN'].includes(getRoleInOrg(org, req.user._id))) {
        return res.status(403).json({ error: 'Only workspace OWNER or ADMIN can list invites' });
      }
    }

    const filter = { orgId: resolvedOrgId };
    if (teamId) filter.teamId = teamId;
    const invites = await Invite.find(filter).sort({ createdAt: -1 }).lean();
    // Never leak tokenHash to frontend (it's the credential). Strip it.
    res.json({ invites: invites.map(({ tokenHash, ...rest }) => rest) });
  } catch (err) {
    res.status(500).json({ error: 'List failed', details: err.message });
  }
};
