// routes/auth.js
// Handles user synchronization between Firebase and our MongoDB.
// When a user signs up or logs in via Firebase, this route ensures
// their data exists in our database.
const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const User = require('../models/User');

// Valid roles in the system
const VALID_ROLES = ['ADMIN', 'MANAGER', 'MEMBER'];

// POST /api/auth/sync
// Syncs a Firebase user with our local database.
// - If user doesn't exist: creates a new user record
// - If user exists: updates their info (name, role, teamId)
// This runs on every login/signup to keep data in sync.
router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    let { name, role, teamId } = req.body;
    const { email, name: firebaseName } = req.firebaseUser;

    // Normalize role: convert to uppercase and validate
    // If invalid role provided, default to MEMBER
    if (role && typeof role === 'string') {
      role = role.toUpperCase();
      if (!VALID_ROLES.includes(role)) {
        role = 'MEMBER';
      }
    } else {
      // No role provided - will preserve existing role for existing users
      // or default to MEMBER for new users
      role = undefined;
    }

    // Check if user already exists in our database
    let user = await User.findOne({ email });

    if (!user) {
      // -----------------------------------------------------------------
      // New User Creation
      // Use try-catch around create to handle race conditions:
      // If two requests arrive simultaneously for the same email,
      // one will succeed and the other will hit the unique constraint.
      // -----------------------------------------------------------------
      try {
        user = await User.create({
          name: name || firebaseName || 'Unnamed',
          email,
          role: role || 'MEMBER',
          teamId: teamId || null,
        });
        return res.status(201).json(user);
      } catch (createErr) {
        // Handle duplicate key error from race condition
        // If another request created the user between our findOne and create,
        // fetch the existing user and return it
        if (createErr.code === 11000) {
          user = await User.findOne({ email });
          if (!user) {
            // Extremely unlikely edge case - re-throw
            throw createErr;
          }
          // Fall through to return the existing user
        } else {
          throw createErr;
        }
      }
    } else {
      // -----------------------------------------------------------------
      // Existing User Update
      // Only update fields that were explicitly provided.
      // This preserves existing values when the client sends empty body
      // (which happens on re-login via onAuthStateChanged).
      // -----------------------------------------------------------------
      if (name) user.name = name;
      if (role) user.role = role; // Preserves existing role if none sent
      if (teamId !== undefined && teamId !== null) user.teamId = teamId;
      await user.save();
      return res.status(200).json(user);
    }
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ error: 'User sync failed', details: err.message });
  }
});

module.exports = router;
