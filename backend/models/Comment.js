// models/Comment.js
// MVP: Task-level comments stored in a separate collection
// Each comment references a Task and the author (User).
// This model is intentionally simple to keep MVP small and extensible.
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

// Indexes to support fast lookups of comments by task and newest first
commentSchema.index({ taskId: 1 });
commentSchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
