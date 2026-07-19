// controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Subtask = require('../models/Subtask');
const Comment = require('../models/Comment');
const cloudinaryService = require('../services/cloudinaryService');
const notificationService = require('../services/notificationService');

// ---------------------------------------------------------------------------
// Helper: Verify project belongs to user's team
// Used before any task operation to ensure users can only access
// tasks within their own team's projects.
// ---------------------------------------------------------------------------
const verifyProjectAccess = async (projectId, userTeamId) => {
  const project = await Project.findById(projectId).select('teamId');
  if (!project) {
    return { error: 'Project not found', status: 404 };
  }
  if (project.teamId.toString() !== userTeamId.toString()) {
    return { error: 'Access denied: project belongs to another team', status: 403 };
  }
  return { project };
};

// GET /api/tasks?projectId=xxx
// Returns all tasks for a specific project.
// Verifies the project belongs to the user's team before returning data.
exports.getTasks = async (req, res) => {
  const { projectId } = req.query;

  // Validate projectId is provided and valid
  if (!projectId || projectId === 'undefined') {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    // Security check: ensure the project belongs to the user's team
    const access = await verifyProjectAccess(projectId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    // Fetch all tasks for this project with assigned user details
    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 }); // Newest first

    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
};

// GET /api/tasks/assigned
// Returns tasks assigned to the currently logged-in user.
// Supports optional status filter (todo, in-progress, done).
exports.getMyTasks = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user._id;
    const { status } = req.query;

    // Build query: find tasks assigned to this user
    const query = { assignedTo: userId };
    if (status) query.status = status; // Optional status filter

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Get my tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned tasks', details: err.message });
  }
};

// POST /api/tasks
// Creates a new task for a project.
// Only ADMIN and MANAGER roles can create tasks (enforced in route).
// Verifies the project belongs to the user's team.
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, projectId, assignedTo, dueDate, priority } = req.body;

    // Validate projectId
    if (!projectId || projectId === 'undefined') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Security check: ensure the project belongs to the user's team
    const access = await verifyProjectAccess(projectId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    // Create the task with the current user as creator
    const newTask = await Task.create({
      title,
      description,
      status,
      projectId,
      assignedTo,
      createdBy: req.user._id,
      dueDate,
      priority
    });

    // Create activity record for task creation
    await Activity.create({
      taskId: newTask._id,
      actorId: req.user._id,
      action: 'task_created',
      details: { title, projectId }
    });

    // Populate assignedTo before returning to include user name/email
    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'name email');

    notificationService.notifyTaskCreated(populatedTask, req.user, req.user.teamId);

    res.status(201).json(populatedTask);
  } catch (err) {
    console.error('Task creation error:', err);
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
};

// PUT /api/tasks/:id
// Updates a task's status, assignee, title, or description.
// Verifies the task's project belongs to the user's team.
exports.updateTask = async (req, res) => {
  try {
    const { status, assignedTo, title, description, dueDate, priority } = req.body;

    // First, find the task to check its project's team
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Security check: verify the task's project belongs to user's team
    const access = await verifyProjectAccess(task.projectId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    // Build update object - only include fields that were provided
    const update = {};
    const activitiesToCreate = [];
    const changedFields = [];

    if (status !== undefined && status !== task.status) {
      update.status = status;
      changedFields.push('status');
      activitiesToCreate.push({
        taskId: task._id,
        actorId: req.user._id,
        action: 'status_changed',
        details: { from: task.status, to: status }
      });
    }

    if (assignedTo !== undefined && assignedTo !== (task.assignedTo?.toString() || null)) {
      update.assignedTo = assignedTo || null;
      changedFields.push('assignedTo');
      activitiesToCreate.push({
        taskId: task._id,
        actorId: req.user._id,
        action: 'assignee_changed',
        details: { from: task.assignedTo?.toString() || null, to: assignedTo || null }
      });
    }

    if (title !== undefined && title !== task.title) {
      update.title = title;
      changedFields.push('title');
      activitiesToCreate.push({
        taskId: task._id,
        actorId: req.user._id,
        action: 'task_updated',
        details: { field: 'title', from: task.title, to: title }
      });
    }

    if (description !== undefined && description !== task.description) {
      update.description = description;
      changedFields.push('description');
      activitiesToCreate.push({
        taskId: task._id,
        actorId: req.user._id,
        action: 'task_updated',
        details: { field: 'description' }
      });
    }

    if (dueDate !== undefined && dueDate !== task.dueDate?.toISOString?.()) {
      update.dueDate = dueDate;
      changedFields.push('dueDate');
      activitiesToCreate.push({
        taskId: task._id,
        actorId: req.user._id,
        action: 'due_date_changed',
        details: { from: task.dueDate, to: dueDate }
      });
    }

    if (priority !== undefined && priority !== task.priority) {
      update.priority = priority;
      changedFields.push('priority');
      activitiesToCreate.push({
        taskId: task._id,
        actorId: req.user._id,
        action: 'priority_changed',
        details: { from: task.priority, to: priority }
      });
    }

    // Apply the update and return the populated result
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true } // Return the updated document
    ).populate('assignedTo', 'name email');

    // Create activity records for each change
    if (activitiesToCreate.length > 0) {
      await Activity.insertMany(activitiesToCreate);
    }

    // Send real-time notifications
    const oldAssigneeId = task.assignedTo?.toString();
    const newAssigneeId = update.assignedTo?.toString();
    if (newAssigneeId !== undefined && newAssigneeId !== oldAssigneeId) {
      notificationService.notifyAssigneeChanged(updated, newAssigneeId || updated.assignedTo?._id, req.user, req.user.teamId);
    }
    const otherChanges = changedFields.filter(f => f !== 'assignedTo');
    if (otherChanges.length > 0) {
      notificationService.notifyTaskUpdated(updated, otherChanges, req.user, req.user.teamId);
    }

    res.json(updated);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
};

// DELETE /api/tasks/:id
// Deletes a task permanently.
// Verifies the task's project belongs to the user's team.
exports.deleteTask = async (req, res) => {
  try {
    // First, find the task to check its project's team
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Security check: verify the task's project belongs to user's team
    const access = await verifyProjectAccess(task.projectId, req.user.teamId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    // Notify before cleanup so we still have the task data
    notificationService.notifyTaskDeleted(task, req.user, req.user.teamId);

    // Delete Cloudinary files if task has attachments
    if (task.attachments && task.attachments.length > 0) {
      const keys = task.attachments.map((a) => a.key);
      await cloudinaryService.deleteFiles(keys).catch((err) => {
        console.error('Cloudinary cleanup error during task deletion:', err);
        // Non-blocking: continue even if cleanup fails
      });
    }

    // Delete related subtasks, comments, activities first, then the task
    // Order matters: clean up children before parent so a partial failure preserves the task
    await Promise.all([
      Subtask.deleteMany({ taskId: req.params.id }),
      Comment.deleteMany({ taskId: req.params.id }),
      Activity.deleteMany({ taskId: req.params.id }),
    ]);
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
};
