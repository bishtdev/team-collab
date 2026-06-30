// routes/auth.js
// Handles user synchronization between Firebase and our MongoDB.
// When a user signs up or logs in via Firebase, this route ensures
// their data exists in our database.
//
// SECURITY: role and teamId are NEVER accepted from the client.
// - role is managed server-side via team membership (see teamController)
// - teamId is only set via PATCH /api/teams/select (with membership verification)
const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const User = require('../models/User');

// POST /api/auth/sync
// Syncs a Firebase user with our local database using atomic upsert.
// Only `name` is accepted from the client body; role and teamId are
// server-authoritative and never writable from this endpoint.
router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const { name } = req.body; // Only name is client-provided
    const { email, name: firebaseName } = req.firebaseUser;

    // Atomic upsert: $setOnInsert for defaults (new users), $set for updates.
    // Never put the same field in both $setOnInsert and $set — that causes a conflict.
    const setOnInsert = { email, role: 'MEMBER' };
    const setUpdates = {};

    if (name) {
      // Name provided by client: apply as update (existing users get it too)
      setUpdates.name = name;
    } else {
      // No name provided: set default only for new users
      setOnInsert.name = firebaseName || 'Unnamed';
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: setOnInsert,
        ...(Object.keys(setUpdates).length > 0 ? { $set: setUpdates } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const statusCode = user.createdAt?.getTime() === user.updatedAt?.getTime() ? 201 : 200;
    return res.status(statusCode).json(user);
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ error: 'User sync failed', details: err.message });
  }
});

module.exports = router;
