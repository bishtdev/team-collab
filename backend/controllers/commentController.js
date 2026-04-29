// controllers/commentController.js
// Handles creating and listing comments for a given task.
// Flow:
// - Validate input
// - Verify user has access to the task via its team
// - Create a Comment document linked to the task and author
// - Return the created comment with author data populated for UI convenience
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { default: mongoose } = require('mongoose');

// Create a new comment for a task
exports.createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { taskId } = req.params;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    // Ensure authenticated user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Load task with its associated project/team to validate access
    const task = await Task.findById(taskId).populate({ path: 'projectId', select: 'teamId' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!task.projectId || !task.projectId.teamId) {
      return res.status(500).json({ error: 'Task ownership data is missing' });
    }
    // Access control: user must belong to the same team as the task's project
    if (task.projectId.teamId.toString() !== req.user.teamId?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newComment = await Comment.create({
      taskId,
      authorId: req.user._id,
      content: content.trim()
    });

    // Create activity record for the comment
    await Activity.create({
      taskId,
      actorId: req.user._id,
      action: 'comment_created',
      details: { commentId: newComment._id }
    });

    const populated = await Comment.findById(newComment._id).populate('authorId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Comment creation error:', err);
    res.status(500).json({ error: 'Failed to create comment', details: err.message });
  }
};

// List comments for a task with pagination
exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Basic validation
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });
    const task = await Task.findById(taskId).populate({ path: 'projectId', select: 'teamId' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.projectId && task.projectId.teamId && task.projectId.teamId.toString() !== req.user?.teamId?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const comments = await Comment.find({ taskId })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Comment.countDocuments({ taskId });
    res.json({ comments, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments', details: err.message });
  }
};
