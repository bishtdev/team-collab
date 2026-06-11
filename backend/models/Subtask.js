const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

subtaskSchema.index({ taskId: 1, order: 1 });
subtaskSchema.index({ taskId: 1, completed: 1 });

module.exports = mongoose.model('Subtask', subtaskSchema);
