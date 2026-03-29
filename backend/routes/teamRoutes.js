// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createTeamSchema } = require('../validators/teamValidator');
const controller = require('../controllers/teamController');

// All routes require authentication
router.use(auth);

// ---------------------------------------------------------------------------
// Team CRUD Operations
// ---------------------------------------------------------------------------

// POST /api/teams - Create a new team
// Any authenticated user can create a team and becomes its ADMIN
router.post('/', validate(createTeamSchema), controller.createTeam);

// GET /api/teams/me - Get current user's active team
router.get('/me', controller.getMyTeam);

// GET /api/teams - List teams owned by the current user
router.get('/', controller.listMyTeams);

// PATCH /api/teams/select - Set the user's active team
router.patch('/select', controller.setActiveTeam);

// ---------------------------------------------------------------------------
// Team Member Management
// ---------------------------------------------------------------------------

// POST /api/teams/:teamId/add-user - Add a user to a team
// Only ADMIN and MANAGER roles can add members
router.post('/:teamId/add-user', checkRole(['ADMIN', 'MANAGER']), controller.addUserToTeam);

// GET /api/teams/:teamId/members - Get all members of a team
router.get('/:teamId/members', controller.getTeamMembers);

// ---------------------------------------------------------------------------
// Admin Endpoints
// ---------------------------------------------------------------------------

// GET /api/teams/users/all - Get all users in the database
// Restricted to ADMIN role only to prevent data exposure
router.get('/users/all', checkRole(['ADMIN']), controller.getAllUsers);

module.exports = router;
