// controllers/projectController.js
const Project = require('../models/Project');
const User = require('../models/User');

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ teamId: req.user.teamId })
      .populate('assignedUsers', 'name email'); // populate assigned users
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, assignedUsers } = req.body;

    if (!req.user.teamId) {
      console.log('CreateProject failed: user has no teamId', req.user);
      return res.status(400).json({ error: 'User is not assigned to any team' });
    }

    // Optional: filter assignedUsers so only users from the same team are assigned
    let finalAssigned = [];
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      const validMembers = await User.find({
        _id: { $in: assignedUsers },
        teamId: req.user.teamId
      }).select('_id');
      finalAssigned = validMembers.map(u => u._id);
    }

    const newProject = await Project.create({
      name,
      description,
      teamId: req.user.teamId,
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
