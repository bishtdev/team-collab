// models/Project.js
const mongoose = require('mongoose');

// orgId denormalized from Team at create (avoids Team lookup on every query).
// Required — a project can only live inside a workspace-owned team.
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
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
projectSchema.index({ orgId: 1 }); // Workspace isolation

module.exports = mongoose.model('Project', projectSchema);
