// middlewares/role.js
// Team-scoped authorization middleware.
// Derives the user's role from their membership in their active team.
// This replaces the old global-role check with per-team role resolution.
const Team = require('../models/Team');

const checkRole = (roles) => async (req, res, next) => {
  try {
    // Must have a user (from auth middleware) and active team
    if (!req.user || !req.user.teamId) {
      return res.status(403).json({ error: 'Access denied. No active team.' });
    }

    // Look up the user's membership in their active team
    const team = await Team.findById(req.user.teamId).select('adminId members').lean();
    if (!team) {
      return res.status(403).json({ error: 'Access denied. Team not found.' });
    }

    // Determine role: adminId takes priority, then check members[] subdoc
    let userRole;
    if (team.adminId && team.adminId.toString() === req.user._id.toString()) {
      userRole = 'ADMIN';
    } else {
      const membership = (team.members || []).find(m => {
        const mid = m.userId ? m.userId.toString() : m.toString();
        return mid === req.user._id.toString();
      });
      userRole = membership ? (membership.role || 'MEMBER') : null;
    }

    if (!userRole || !roles.includes(userRole)) {
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
