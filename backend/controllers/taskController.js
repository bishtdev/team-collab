// controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');

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
    const { title, description, status, projectId, assignedTo } = req.body;

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
      createdBy: req.user._id
    });

    // Populate assignedTo before returning to include user name/email
    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'name email');

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
    const { status, assignedTo, title, description } = req.body;

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
    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo || null;
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;

    // Apply the update and return the populated result
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true } // Return the updated document
    ).populate('assignedTo', 'name email');

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

    // Delete the task
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
};
