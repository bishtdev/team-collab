// routes/auth.js
const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const User = require('../models/User');

const VALID_ROLES = ['ADMIN', 'MANAGER', 'MEMBER'];

router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    let { name, role, teamId } = req.body;
    const { email, name: firebaseName } = req.firebaseUser;

    // Normalize role if provided; otherwise leave undefined
    if (role && typeof role === 'string') {
      role = role.toUpperCase();
      if (!VALID_ROLES.includes(role)) {
        role = 'MEMBER';
      }
    } else {
      role = undefined; // do not default here for existing users
    }

    let user = await User.findOne({ email });

    if (!user) {
      // On creation, apply defaults
      await User.create({
        name: name || firebaseName || 'Unnamed',
        email,
        role: role || 'MEMBER',
        teamId: teamId || null,
      }).then((created) => {
        return res.status(201).json(created);
      });
    } else {
      // Update only if provided
      if (name) user.name = name;
      if (role) user.role = role; // preserves existing role if none sent
      if (teamId !== undefined && teamId !== null) user.teamId = teamId;
      await user.save();
      res.status(200).json(user);
    }
  } catch (err) {
    res.status(500).json({ error: 'User sync failed', details: err.message });
  }
});

module.exports = router;
