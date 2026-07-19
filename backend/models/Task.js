// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  attachments: [{
    url: { type: String, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  }],
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
taskSchema.index({ dueDate: 1 }); // Fast lookup of tasks by due date
taskSchema.index({ priority: 1 }); // Fast lookup of tasks by priority

module.exports = mongoose.model('Task', taskSchema);
