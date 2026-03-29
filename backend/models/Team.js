// models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ---------------------------------------------------------------------------
// Database Indexes
// - adminId: Used to find teams owned by a user (listMyTeams)
// - members: Used to check if a user belongs to a team
// ---------------------------------------------------------------------------
teamSchema.index({ adminId: 1 }); // Fast lookup of teams by admin
teamSchema.index({ members: 1 }); // Fast lookup of teams by member

module.exports = mongoose.model('Team', teamSchema);
