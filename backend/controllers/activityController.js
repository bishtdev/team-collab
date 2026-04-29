// controllers/activityController.js
// Handles creating and listing task activities (audit log).
const Activity = require('../models/Activity');
const Task = require('../models/Task');

// Create an activity for a task
exports.createActivity = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, details } = req.body || {};

    if (!taskId) return res.status(400).json({ error: 'taskId is required' });
    if (!action) return res.status(400).json({ error: 'action is required' });
    if (!req.user || !req.user._id) return res.status(401).json({ error: 'User not authenticated' });

    // Validate task and access as in comments
    const task = await Task.findById(taskId).populate({ path: 'projectId', select: 'teamId' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.projectId && task.projectId.teamId && task.projectId.teamId.toString() !== req.user?.teamId?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activity = await Activity.create({
      taskId,
      actorId: req.user._id,
      action,
      details
    });
    res.status(201).json(activity);
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ error: 'Failed to create activity', details: err.message });
  }
};

// List activities for a task with pagination
exports.getActivities = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!taskId) return res.status(400).json({ error: 'taskId is required' });
    const task = await Task.findById(taskId).populate({ path: 'projectId', select: 'teamId' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.projectId && task.projectId.teamId && task.projectId.teamId.toString() !== req.user?.teamId?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const activities = await Activity.find({ taskId })
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Activity.countDocuments({ taskId });
    res.json({ activities, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities', details: err.message });
  }
};
