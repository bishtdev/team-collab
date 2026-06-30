// routes/messageRoutes.js
// Handles chat message retrieval with pagination.
// Without pagination, loading all messages for a team with thousands
// of messages would consume excessive memory and slow down the server.
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');

// All message routes require authentication
router.use(auth);

// GET /api/messages/:teamId?page=1&limit=50
// Fetches messages for a team with cursor-based pagination.
// Messages are sorted by timestamp in descending order (newest first).
// Query parameters:
//   - page: Page number (default: 1)
//   - limit: Messages per page (default: 50, max: 100)
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    // SECURITY: only allow reading messages from the user's active team
    if (!req.user.teamId || req.user.teamId.toString() !== teamId) {
      return res.status(403).json({ error: 'Access denied. You can only read messages from your active team.' });
    }

    // Parse pagination parameters with defaults and bounds
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // Fetch messages with pagination
    // - Sort by timestamp descending (newest first) for efficient pagination
    // - Populate sender info (name, email) for display
    // - Skip and limit for pagination
    const messages = await Message.find({ teamId })
      .populate('senderId', 'name email')
      .sort({ timestamp: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (returns plain objects)

    // Get total count for pagination metadata
    const totalMessages = await Message.countDocuments({ teamId });

    // Reverse messages so they display oldest-first in the chat UI
    // (we fetched newest-first for efficient DB pagination)
    messages.reverse();

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        hasMore: skip + messages.length < totalMessages
      }
    });
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
