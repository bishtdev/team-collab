// controllers/projectController.js
// Org-aware: projects carry orgId (denormalized from Team). Reads scoped by
// orgId (preferred) or legacy teamId. Cross-org reads return 404 (not 403)
// to avoid confirming existence of other companies' projects.
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const Org = require('../models/Org');
const { getRoleInOrg } = require('../middlewares/orgScope');
const { isOwnerEmail } = require('../config/flags');

exports.getProjects = async (req, res) => {
  try {
    // Preferred: ?orgId=xxx&teamId=yyy (both scoped). Legacy: active teamId.
    const { orgId, teamId } = req.query;
    if (orgId) {
      const org = await Org.findById(orgId).select('members').lean();
      if (!org) return res.status(404).json({ error: 'Workspace not found' });
      if (!isOwnerEmail(req.user.email) && !getRoleInOrg(org, req.user._id)) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }
      const filter = { orgId };
      if (teamId) filter.teamId = teamId;
      const projects = await Project.find(filter).populate('assignedUsers', 'name email');
      return res.json(projects);
    }
    const projects = await Project.find({ teamId: req.user.teamId })
      .populate('assignedUsers', 'name email'); // populate assigned users
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, assignedUsers, teamId: bodyTeamId, orgId: bodyOrgId } = req.body;
    // Resolve team: explicit teamId preferred, else active team (legacy).
    const teamId = bodyTeamId || req.user.teamId;
    if (!teamId) {
      console.log('CreateProject failed: user has no teamId', req.user);
      return res.status(400).json({ error: 'User is not assigned to any team' });
    }
    // Resolve org from Team (truth) so project can't be planted in another org.
    const team = await Team.findById(teamId).select('orgId').lean();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    // A client-supplied orgId must match the team's real workspace — never trust a pair.
    if (bodyOrgId && String(bodyOrgId) !== String(team.orgId)) {
      return res.status(400).json({ error: 'Project workspace does not match the team' });
    }
    const orgId = team.orgId;
    const org = await Org.findById(orgId).select('members').lean();
    if (!isOwnerEmail(req.user.email) && !getRoleInOrg(org, req.user._id)) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    // Optional: filter assignedUsers so only users from the same team are assigned
    let finalAssigned = [];
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      const validMembers = await User.find({
        _id: { $in: assignedUsers },
        teamId
      }).select('_id');
      finalAssigned = validMembers.map(u => u._id);
    }

    const newProject = await Project.create({
      name,
      description,
      teamId,
      orgId,
      assignedUsers: finalAssigned
    });

    const populated = await Project.findById(newProject._id).populate('assignedUsers', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, assignedUsers } = req.body;

    // Validate assignedUsers similarly
    let finalAssigned = undefined;
    if (assignedUsers !== undefined) {
      if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
        const validMembers = await User.find({
          _id: { $in: assignedUsers },
          teamId: req.user.teamId
        }).select('_id');
        finalAssigned = validMembers.map(u => u._id);
      } else {
        finalAssigned = [];
      }
    }

    const update = { name, description };
    if (finalAssigned !== undefined) update.assignedUsers = finalAssigned;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, teamId: req.user.teamId },
      update,
      { new: true }
    ).populate('assignedUsers', 'name email');

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({
      _id: req.params.id,
      teamId: req.user.teamId,
    });
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
