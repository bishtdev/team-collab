const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createTeamSchema } = require('../validators/teamValidator');
const controller = require('../controllers/teamController');
const User = require('../models/User');

router.use(auth);

// Create team (any authenticated user — becomes ADMIN)
router.post('/', validate(createTeamSchema), controller.createTeam);

// Get my team
router.get('/me', controller.getMyTeam);

router.get('/', controller.listMyTeams);
// Set active team
router.patch('/select', controller.setActiveTeam);

//to assign team member to team
router.post('/:teamId/add-user', checkRole(['ADMIN', 'MANAGER']), controller.addUserToTeam);
router.get('/:teamId/members', controller.getTeamMembers);

// Get all users in the database
router.get('/users/all', controller.getAllUsers);

// GET /api/users/team -> returns users in the same team as req.user
router.get('/team', async (req, res) => {
  try {
    if (!req.user.teamId) return res.status(400).json({ error: 'User has no active team' });
    const members = await User.find({ teamId: req.user.teamId }).select('name email role _id');
    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

module.exports = router;
