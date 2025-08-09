const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');

router.use(auth);

// GET all messages of a team
router.get('/:teamId', async (req, res) => {
  try {
    const messages = await Message.find({ teamId: req.params.teamId })
      .populate('senderId', 'name email')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
