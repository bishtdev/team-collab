const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_created', 'task_updated', 'task_deleted', 'comment_added', 'assignee_changed', 'subtask_completed', 'subtask_uncompleted', 'attachment_added', 'attachment_removed'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
