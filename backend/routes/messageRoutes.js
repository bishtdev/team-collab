// routes/messageRoutes.js
// Handles chat message retrieval with pagination.
// Without pagination, loading all messages for a team with thousands
// of messages would consume excessive memory and slow down the server.
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');
const Team = require('../models/Team');
const Org = require('../models/Org');
const { getRoleInOrg } = require('../middlewares/orgScope');
const { isOwnerEmail } = require('../config/flags');

// All message routes require authentication
router.use(auth);

// GET /api/messages/:teamId?page=1&limit=50
// Org-aware: caller must be in the team's org (Org.members), not just active team.
// This fixes cross-org reads + multi-team (active-team equality was too strict/wrong).
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    // SECURITY: membership in the REQUESTED team's org (Team.members fallback for legacy).
    const team = await Team.findById(teamId).select('orgId members').lean();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    let allowed = false;
    if (isOwnerEmail(req.user.email)) allowed = true;
    if (!allowed && team.orgId) {
      const org = await Org.findById(team.orgId).select('members').lean();
      allowed = !!getRoleInOrg(org, req.user._id);
    }
    if (!allowed) {
      allowed = (team.members || []).some((m) => String(m.userId || m) === String(req.user._id));
    }
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this workspace.' });
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
