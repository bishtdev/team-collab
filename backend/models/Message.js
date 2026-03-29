// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000 // Prevent excessively long messages
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// ---------------------------------------------------------------------------
// Database Indexes
// - teamId + timestamp: Compound index for paginated message retrieval.
//   This is the most critical index as messages are always fetched
//   sorted by timestamp within a team.
// - senderId: Used for finding messages by a specific user (audit)
// ---------------------------------------------------------------------------
messageSchema.index({ teamId: 1, timestamp: -1 }); // Paginated chat history
messageSchema.index({ senderId: 1 }); // User message history

module.exports = mongoose.model('Message', messageSchema);
