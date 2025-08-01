const Project = require('../models/Project');

// Get all projects for user's team
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ teamId: req.user.teamId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

// Create new project (Admin or Manager)
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newProject = await Project.create({
      name,
      description,
      teamId: req.user.teamId,
    });
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Update project (Admin or Manager)
exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, teamId: req.user.teamId },
      { name, description },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Delete project (Admin only)
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
