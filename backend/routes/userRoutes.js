// routes/userRoutes.js
// Separated from teamRoutes to avoid duplicate route mounting.
// Previously teamRoutes was mounted on both /api/teams and /api/users,
// which caused route conflicts and double-nesting issues.
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');

// All routes in this file require authentication
router.use(auth);

// GET /api/users/team
// Returns all users in the same team as the authenticated user.
// Used by the frontend to populate team member lists for task assignment.
router.get('/team', async (req, res) => {
  try {
    // Ensure the user has an active team
    if (!req.user.teamId) {
      return res.status(400).json({ error: 'User has no active team' });
    }

    // Find all users belonging to the same team
    // Only return necessary fields (name, email, role, _id)
    const members = await User.find({ teamId: req.user.teamId })
      .select('name email role _id');

    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

module.exports = router;
