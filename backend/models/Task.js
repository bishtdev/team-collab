// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ---------------------------------------------------------------------------
// Database Indexes
// - projectId: Used to find all tasks for a project (getTasks)
// - projectId + status: Compound index for kanban board column queries
// - assignedTo: Used to find tasks assigned to a user (getMyTasks)
// - createdBy: Audit trail for who created tasks
// ---------------------------------------------------------------------------
taskSchema.index({ projectId: 1 }); // Fast lookup of tasks by project
taskSchema.index({ projectId: 1, status: 1 }); // Kanban board columns
taskSchema.index({ assignedTo: 1 }); // Fast lookup of user's assigned tasks
taskSchema.index({ createdBy: 1 }); // Audit trail

module.exports = mongoose.model('Task', taskSchema);
