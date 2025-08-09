const Task = require('../models/Task');

// Get all tasks for a project
exports.getTasks = async (req, res) => {
  const { projectId } = req.query;
  if (!projectId || projectId === 'undefined') {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    const tasks = await Task.find({ projectId }).populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
};

// Get tasks assigned to the logged-in user
exports.getMyTasks = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user._id;
    const { status } = req.query;

    const query = { assignedTo: userId };
    if (status) query.status = status;

    const tasks = await Task.find(query).populate('projectId', 'name');
    res.json(tasks);
  } catch (err) {
    console.error('Get my tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned tasks', details: err.message });
  }
};

// Create a task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, projectId, assignedTo } = req.body;
    
    if (!projectId || projectId === 'undefined') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const newTask = await Task.create({
      title,
      description,
      status,
      projectId,
      assignedTo,
      createdBy: req.user._id
    });
    
    // Populate the assignedTo field before returning
    const populatedTask = await Task.findById(newTask._id).populate('assignedTo', 'name email');
    res.status(201).json(populatedTask);
  } catch (err) {
    console.error('Task creation error:', err);
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
};

// Update task (status or assignee)
exports.updateTask = async (req, res) => {
  try {
    const { status, assignedTo, title, description } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status, assignedTo, title, description },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
};
