// middlewares/orgScope.js
// Org-level guards. Org.members[] is the truth for cross-company isolation.
// - requireOrgMember: caller must be in Org.members (or platform break-glass).
// - requireOrgRole([...]): caller role in THIS org must be allowed.
// Org id comes from req.params.orgId, req.body.orgId, or req.query.orgId.
// Resolved org is attached as req.org for controllers (avoids re-fetch).
const Org = require('../models/Org');
const { isOwnerEmail } = require('../config/flags');

// Platform break-glass: ADMIN_EMAILS can read any org (support/debug, audited).
// Why kept: you (maker) need recovery access without being a member.
// Never expose in customer UI.
const isBreakGlass = (email) => isOwnerEmail(email);

const loadOrg = async (orgId) => {
  if (!orgId) return null;
  return Org.findById(orgId).select('name slug ownerId members').lean();
};

const getRoleInOrg = (org, userId) => {
  if (!org || !userId) return null;
  const m = (org.members || []).find((x) => String(x.userId) === String(userId));
  return m ? m.role || 'MEMBER' : null;
};

const requireOrgMember = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.query.orgId;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    if (req.user?.email && isBreakGlass(req.user.email)) {
      req.org = await loadOrg(orgId);
      req.orgRole = 'OWNER'; // break-glass acts as OWNER (audited separately)
      return next();
    }
    const org = await loadOrg(orgId);
    if (!org) return res.status(404).json({ error: 'Workspace not found' });
    const role = getRoleInOrg(org, req.user._id);
    if (!role) return res.status(403).json({ error: 'Not a member of this workspace' });
    req.org = org;
    req.orgRole = role;
    return next();
  } catch (err) {
    console.error('requireOrgMember error:', err);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

const requireOrgRole = (allowed) => async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.query.orgId;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    if (req.user?.email && isBreakGlass(req.user.email)) {
      req.org = await loadOrg(orgId);
      req.orgRole = 'OWNER';
      return next();
    }
    const org = await loadOrg(orgId);
    if (!org) return res.status(404).json({ error: 'Workspace not found' });
    const role = getRoleInOrg(org, req.user._id);
    // OWNER passes every check (superset).
    if (!role || !(allowed.includes(role) || role === 'OWNER')) {
      return res.status(403).json({ error: 'Insufficient permissions in this workspace' });
    }
    req.org = org;
    req.orgRole = role;
    return next();
  } catch (err) {
    console.error('requireOrgRole error:', err);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = { requireOrgMember, requireOrgRole, getRoleInOrg, loadOrg };
