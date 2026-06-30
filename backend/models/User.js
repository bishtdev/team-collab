// models/User.js
// User model. The `role` field is a CACHED copy of the user's role in their
// active team (stored authoritatively in Team.members[].role).
// Updated on createTeam, setActiveTeam, and via socket-triggered refreshUser.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
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

// Database Indexes
userSchema.index({ teamId: 1 });

module.exports = mongoose.model('User', userSchema);
