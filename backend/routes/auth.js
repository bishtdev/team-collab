// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middlewares/auth');

// Create or sync user from Firebase
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { name, role, teamId } = req.body;

    let user = await User.findOne({ email: req.user.email });

    if (!user) {
      user = await User.create({
        name,
        email: req.user.email,
        role: role || 'MEMBER',
        teamId: teamId || null,
      });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'User sync failed', details: err.message });
  }
});

module.exports = router;
