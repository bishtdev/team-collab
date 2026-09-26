// middlewares/platform.js
// Owner + team-role guards for the rework.
// - requireOwner: platform owner check (email in ADMIN_EMAILS). Used for
//   team creation (strict mode) and granting ADMIN role.
// - requireTeamRole([...]): checks Team.members[].role for the target team.
//   Target team id comes from req.params.teamId, req.body.teamId, or req.user.teamId.
// Why separate from checkRole? checkRole uses active team; these check the
// *target* team being acted on (important for invite / role-change endpoints).
const Team = require('../models/Team');
const { isOwnerEmail } = require('../config/flags');

// Platform owner = email listed in ADMIN_EMAILS env.
// This is the "one admin who handles everything" in strict mode.
const requireOwner = (req, res, next) => {
  const email = req.user?.email || req.firebaseUser?.email;
  if (email && isOwnerEmail(email)) return next();
  return res.status(403).json({ error: 'Access denied. Owner only.' });
};

// Resolve caller's role in a specific team (not just active team).
const getRoleInTeam = async (userId, teamId) => {
  if (!userId || !teamId) return null;
  // Owner emails always resolve to OWNER (even if members[] not yet backfilled).
  // This prevents lockout during migration.
  const team = await Team.findById(teamId).select('members ownerId adminId').lean();
  if (!team) return null;
  const mid = String(userId);
  const m = (team.members || []).find((x) => {
    const id = x.userId ? String(x.userId) : String(x);
    return id === mid;
  });
  if (m?.role) return m.role;
  // Legacy fallback: adminId pointer means ADMIN.
  if (team.adminId && String(team.adminId) === mid) return 'ADMIN';
  if (team.ownerId && String(team.ownerId) === mid) return 'OWNER';
  return null;
};

const requireTeamRole = (allowed) => async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.teamId || req.user?.teamId;
    if (!teamId) return res.status(403).json({ error: 'Access denied. No team context.' });
    // Owner bypass: platform owner can act on any team.
    const email = req.user?.email;
    if (email && isOwnerEmail(email)) {
      req.userRole = 'OWNER';
      req.targetTeamId = teamId;
      return next();
    }
    const role = await getRoleInTeam(req.user._id, teamId);
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    req.userRole = role;
    req.targetTeamId = teamId;
    return next();
  } catch (err) {
    console.error('requireTeamRole error:', err);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = { requireOwner, requireTeamRole, getRoleInTeam };
