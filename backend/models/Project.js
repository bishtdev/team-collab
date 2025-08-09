// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  // New: assigned users to project
  assignedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
