// routes/auth.js
const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const User = require('../models/User');

router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, role, teamId } = req.body;
    const email = req.firebaseUser.email;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        role: role || 'MEMBER',
        teamId: teamId || null,
      });
    } else {
      // Optionally: update name/role/teamId if provided
      if (name) user.name = name;
      if (role) user.role = role;
      if (teamId !== undefined) user.teamId = teamId;
      await user.save();
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'User sync failed', details: err.message });
  }
});

module.exports = router;
