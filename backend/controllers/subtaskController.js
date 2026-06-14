const Subtask = require('../models/Subtask');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const notificationService = require('../services/notificationService');

const verifyTaskAccess = async (taskId, userTeamId) => {
  const task = await Task.findById(taskId).populate({ path: 'projectId', select: 'teamId' });
  if (!task) return { error: 'Task not found', status: 404 };
  if (!task.projectId || !task.projectId.teamId) {
    return { error: 'Task ownership data is missing', status: 500 };
  }
  if (task.projectId.teamId.toString() !== userTeamId?.toString()) {
    return { error: 'Access denied', status: 403 };
  }
  return { task };
};

exports.createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, assigneeId } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const access = await verifyTaskAccess(taskId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const maxOrder = await Subtask.findOne({ taskId }).sort({ order: -1 }).select('order');
    const order = (maxOrder?.order ?? -1) + 1;

    const newSubtask = await Subtask.create({
      taskId,
      title: title.trim(),
      assigneeId: assigneeId || undefined,
      order,
    });

    await Activity.create({
      taskId,
      actorId: req.user._id,
      action: 'subtask_added',
      details: { subtaskId: newSubtask._id, title: newSubtask.title },
    });

    await Subtask.populate(newSubtask, { path: 'assigneeId', select: 'name email' });
    res.status(201).json(newSubtask);
  } catch (err) {
    console.error('Subtask creation error:', err);
    res.status(500).json({ error: 'Failed to create subtask', details: err.message });
  }
};

exports.getSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const access = await verifyTaskAccess(taskId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const subtasks = await Subtask.find({ taskId })
      .populate('assigneeId', 'name email')
      .sort({ order: 1, createdAt: 1 });

    res.json({ subtasks });
  } catch (err) {
    console.error('Get subtasks error:', err);
    res.status(500).json({ error: 'Failed to fetch subtasks', details: err.message });
  }
};

exports.updateSubtask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const access = await verifyTaskAccess(taskId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const existing = await Subtask.findOne({ _id: subtaskId, taskId });
    if (!existing) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const { title, completed, assigneeId } = req.body;
    const update = {};
    const activitiesToCreate = [];

    if (title !== undefined && title !== existing.title) {
      update.title = title.trim();
    }

    if (completed !== undefined && completed !== existing.completed) {
      update.completed = completed;
      activitiesToCreate.push({
        taskId,
        actorId: req.user._id,
        action: completed ? 'subtask_completed' : 'subtask_uncompleted',
        details: { subtaskId: existing._id, title: existing.title },
      });
    }

    if (assigneeId !== undefined) {
      update.assigneeId = assigneeId || null;
    }

    if (Object.keys(update).length === 0) {
      await Subtask.populate(existing, { path: 'assigneeId', select: 'name email' });
      return res.json(existing);
    }

    const updated = await Subtask.findByIdAndUpdate(subtaskId, update, { new: true })
      .populate('assigneeId', 'name email');

    if (activitiesToCreate.length > 0) {
      await Activity.insertMany(activitiesToCreate);
    }

    if (completed !== undefined && completed !== existing.completed) {
      notificationService.notifySubtaskChanged(updated, access.task, req.user, req.user.teamId);
    }

    res.json(updated);
  } catch (err) {
    console.error('Update subtask error:', err);
    res.status(500).json({ error: 'Failed to update subtask', details: err.message });
  }
};

exports.deleteSubtask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const access = await verifyTaskAccess(taskId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const subtask = await Subtask.findOneAndDelete({ _id: subtaskId, taskId });
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    await Activity.create({
      taskId,
      actorId: req.user._id,
      action: 'subtask_removed',
      details: { subtaskId: subtask._id, title: subtask.title },
    });

    res.json({ message: 'Subtask deleted', subtaskId: subtask._id });
  } catch (err) {
    console.error('Delete subtask error:', err);
    res.status(500).json({ error: 'Failed to delete subtask', details: err.message });
  }
};
