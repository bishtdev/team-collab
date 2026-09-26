// middlewares/role.js
// Team-scoped authorization middleware.
// members[] is the SOLE source of truth (see roleRework.md).
// - No more adminId priority (adminId is legacy/compat only).
// - OWNER bypass: email in ADMIN_EMAILS always passes (prevents lockout in migration).
// - User.role cache is NEVER read here (it's UX-only now).
const Team = require('../models/Team');
const { isOwnerEmail } = require('../config/flags');

const checkRole = (roles) => async (req, res, next) => {
  try {
    // Must have a user (from auth middleware) and active team
    if (!req.user || !req.user.teamId) {
      return res.status(403).json({ error: 'Access denied. No active team.' });
    }

    // Owner bypass first: platform owner passes any role check.
    // Why: owners must never be locked out by a stale members[] entry.
    if (req.user.email && isOwnerEmail(req.user.email)) {
      req.userRole = 'OWNER';
      // OWNER is treated as superset: allow even if caller asked for ADMIN/MANAGER.
      return next();
    }

    // Look up the user's membership in their active team
    const team = await Team.findById(req.user.teamId).select('members').lean();
    if (!team) {
      return res.status(403).json({ error: 'Access denied. Team not found.' });
    }

    // Single source: members[].role only.
    const membership = (team.members || []).find(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === req.user._id.toString();
    });
    const userRole = membership ? (membership.role || 'MEMBER') : null;

    // OWNER is superset of every role (new workspaces store creator as OWNER
    // in Team.members). Without this, org owners get 403 on project/task routes
    // that list only ADMIN/MANAGER.
    if (!userRole || !(roles.includes(userRole) || userRole === 'OWNER')) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Attach resolved role to request for controllers that need it
    req.userRole = userRole;
    next();
  } catch (err) {
    console.error('checkRole error:', err);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = checkRole;
