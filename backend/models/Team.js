// models/Team.js
// Team model with per-team roles embedded in members[] subdocuments.
// Each member entry has { userId, role } where role is ADMIN | MANAGER | MEMBER.
// adminId is retained for fast "who owns this team" lookups.
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'MEMBER'], default: 'MEMBER' }
}, { _id: false }); // _id: false avoids creating IDs for subdocuments

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [memberSchema],
}, { timestamps: true });

// Database Indexes
// - adminId: find teams owned by a user
// - members.userId: find teams a user belongs to
teamSchema.index({ adminId: 1 });
teamSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Team', teamSchema);
