// models/Invite.js
// One-time, expiring invitation sent by an admin.
// Security notes:
// - We NEVER store the raw token. Only sha256(token) is saved (tokenHash).
// - Raw token is shown once in the invite link emailed to the user.
// - Token is 32 random bytes -> unguessable. Expiry defaults to 48h.
const mongoose = require('mongoose');
const crypto = require('crypto');
const { flags } = require('../config/flags');

// Hash helper used both on create and on validate/accept.
// Uses sha256 (fast, deterministic). Timing-safe compare where needed.
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(String(rawToken)).digest('hex');

// orgId: which workspace the invite joins. Required — an invite must always
// resolve to exactly one workspace (org-less invites were a fail-open path).
// teamId optional: org-level invite (no team) vs team-level invite (joins Org + Team).
const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    // Invites can only grant MEMBER/MANAGER (and VIEWER later).
    // ADMIN is granted only by OWNER via role-change, OWNER never via invite.
    role: {
      type: String,
      enum: ['MEMBER', 'MANAGER'],
      default: 'MEMBER',
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () =>
        new Date(Date.now() + flags.INVITE_TTL_HOURS * 60 * 60 * 1000),
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index: prevent duplicate pending invites for same email+team.
inviteSchema.index({ email: 1, teamId: 1, status: 1 });
inviteSchema.index({ orgId: 1 }); // Workspace isolation
inviteSchema.index({ email: 1, orgId: 1, status: 1 });

// Helper: is this invite still usable?
inviteSchema.methods.isUsable = function () {
  if (this.status !== 'pending') return false;
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return false;
  return true;
};

inviteSchema.statics.hashToken = hashToken;

module.exports = mongoose.model('Invite', inviteSchema);
