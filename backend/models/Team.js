// models/Team.js
// Team model with per-team roles embedded in members[] subdocuments.
// members[] is the SOLE source of truth for authorization (see middlewares/role.js).
// - ownerId: platform owner (from ADMIN_EMAILS seed). Optional for backwards compat.
// - adminId: legacy per-team admin pointer, kept for compat + fast lookup.
//   New code should read members[].role, not adminId alone.
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // OWNER is platform-level (seeded). ADMIN/MANAGER/MEMBER are per-team.
  // OWNER stored here too so checkRole works uniformly.
  role: { type: String, enum: ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'], default: 'MEMBER' },
  joinedAt: { type: Date, default: Date.now }, // when they joined (for audit/UI)
}, { _id: false }); // _id: false avoids creating IDs for subdocuments

// orgId: isolation boundary. Required — every team belongs to exactly one workspace.
// Org-lessness was the root cause of the cross-org join bypass; run the backfill
// script before deploying this constraint (see migrate-single-to-orgs.js).
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [memberSchema],
}, { timestamps: true });

// Database Indexes
// - orgId: scope all team queries to one workspace (isolation)
// - ownerId/adminId: find teams owned by a user
// - members.userId: find teams a user belongs to
teamSchema.index({ orgId: 1 });
teamSchema.index({ ownerId: 1 });
teamSchema.index({ adminId: 1 });
teamSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Team', teamSchema);
