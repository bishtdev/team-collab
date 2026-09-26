// controllers/orgController.js
// Self-serve workspace bootstrap. NO script needed for Anil/Priya.
// - createOrg: any authed user → creates Org + default "General" Team + OWNER membership.
//   This is Door 1 (create). Door 2 (join) is POST /invites/:token/accept.
// - listMyOrgs: ONLY orgs where I'm a member (no public directory → workers can't discover Anil's org).
// - selectOrg: sets User.lastActiveOrgId UX pointer.
const Org = require('../models/Org');
const Team = require('../models/Team');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { flags } = require('../config/flags');

// POST /api/orgs — {name} -> Org + default Team, caller = OWNER.
// Rate-limited in routes (5/hr) to prevent org spam.
exports.createOrg = async (req, res) => {
  try {
    if (!flags.ALLOW_ORG_CREATION) {
      return res.status(403).json({ error: 'Workspace creation disabled. Ask admin.' });
    }
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Workspace name required' });

    // Slug retry loop: buildSlug has random suffix, collisions are rare but possible.
    let org = null;
    for (let i = 0; i < 3; i += 1) {
      try {
        org = await Org.create({
          name: String(name).trim(),
          slug: Org.buildSlug(name),
          ownerId: req.user._id,
          members: [{ userId: req.user._id, role: 'OWNER' }],
        });
        break;
      } catch (e) {
        if (e.code !== 11000) throw e; // only retry on slug collision
      }
    }
    if (!org) return res.status(500).json({ error: 'Could not create workspace, retry' });

    // Default team so the workspace is usable immediately (projects need a team).
    const team = await Team.create({
      name: 'General',
      description: 'Default team',
      orgId: org._id,
      ownerId: req.user._id,
      adminId: req.user._id,
      members: [{ userId: req.user._id, role: 'OWNER' }],
    });

    // Point user at new workspace (UX only, never used for authz).
    await User.findByIdAndUpdate(req.user._id, {
      lastActiveOrgId: org._id,
      teamId: team._id,
      role: 'ADMIN', // cached copy for old UI
    });

    await Activity.create({
      taskId: null, actorId: req.user._id, action: 'org_created',
      details: { orgId: org._id, name: org.name },
    });

    res.status(201).json({ org, team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace', details: err.message });
  }
};

// GET /api/orgs — ONLY my orgs. This is what stops workers discovering Anil's company.
exports.listMyOrgs = async (req, res) => {
  try {
    const orgs = await Org.find({ 'members.userId': req.user._id })
      .select('name slug ownerId members plan createdAt')
      .lean();
    // Attach my role per org for the switcher UI (no extra query needed).
    const withRole = orgs.map((o) => ({
      ...o,
      myRole: (o.members || []).find((m) => String(m.userId) === String(req.user._id))?.role || 'MEMBER',
    }));
    res.json({ orgs: withRole });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
};

// GET /api/orgs/:orgId — detail + my role (member only, enforced by middleware too).
exports.getOrg = async (req, res) => {
  try {
    // req.org set by requireOrgMember; refetch with members populated for UI.
    const org = await Org.findById(req.params.orgId)
      .populate('members.userId', 'name email')
      .lean();
    if (!org) return res.status(404).json({ error: 'Workspace not found' });
    res.json({ org, myRole: req.orgRole });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
};

// PATCH /api/orgs/:orgId — rename, OWNER only.
exports.renameOrg = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name required' });
    const org = await Org.findByIdAndUpdate(
      req.params.orgId, { name: String(name).trim() }, { new: true }
    ).lean();
    res.json({ org });
  } catch (err) {
    res.status(500).json({ error: 'Rename failed', details: err.message });
  }
};

// POST /api/orgs/:orgId/select — set active workspace pointer (member only).
exports.selectOrg = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastActiveOrgId: req.params.orgId });
    const user = await User.findById(req.user._id).lean();
    res.json({ user, org: req.org, myRole: req.orgRole });
  } catch (err) {
    res.status(500).json({ error: 'Select failed', details: err.message });
  }
};
