const Task = require('../models/Task');

// Get all tasks for a project
exports.getTasks = async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  try {
    const tasks = await Task.find({ projectId }).populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Create a tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, projectId, assignedTo } = req.body;
    const newTask = await Task.create({
      title,
      description,
      status,
      projectId,
      assignedTo,
    });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
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
    );
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
