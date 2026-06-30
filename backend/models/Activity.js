// models/Activity.js
// MVP: Lightweight activity log tied to a Task
// Captures who performed what action on which task with contextual details.
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false // Optional: team-level audit events (role_change, etc.) have no taskId
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Indexes for efficient feeds per task and by time
activitySchema.index({ taskId: 1 });
activitySchema.index({ taskId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
