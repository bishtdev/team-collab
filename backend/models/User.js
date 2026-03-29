// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Creates a unique index automatically
    lowercase: true, // Normalize email to lowercase
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'MEMBER'],
    default: 'MEMBER',
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
}, { timestamps: true });

// ---------------------------------------------------------------------------
// Database Indexes
// These indexes speed up common query patterns:
// - teamId: Used to find all users in a team (getTeamMembers, /users/team)
// - email + unique: Already created by the unique constraint, used for auth lookups
// - role: Used for role-based filtering
// ---------------------------------------------------------------------------
userSchema.index({ teamId: 1 }); // Fast lookup of users by team
userSchema.index({ role: 1 }); // Fast filtering by role

module.exports = mongoose.model('User', userSchema);
