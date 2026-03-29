// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  assignedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
}, { timestamps: true });

// ---------------------------------------------------------------------------
// Database Indexes
// - teamId: Used to find all projects for a team (getProjects)
// - teamId + createdAt: Compound index for sorted project listings
// ---------------------------------------------------------------------------
projectSchema.index({ teamId: 1 }); // Fast lookup of projects by team
projectSchema.index({ teamId: 1, createdAt: -1 }); // Sorted project listing

module.exports = mongoose.model('Project', projectSchema);
