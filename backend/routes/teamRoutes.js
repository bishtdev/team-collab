// routes/teamRoutes.js
// Team CRUD and membership management routes.
// Role checks use the refactored checkRole middleware which derives role
// from the user's membership in their active team (see middlewares/role.js).
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

// POST /api/teams - Create a new team (any authenticated user)
router.post('/', validate(createTeamSchema), controller.createTeam);

// GET /api/teams/me - Get current user's active team
router.get('/me', controller.getMyTeam);

// GET /api/teams - List teams where user is admin or member
router.get('/', controller.listMyTeams);

// GET /api/teams/memberships - List all team memberships for the user
router.get('/memberships', controller.getMyMemberships);

// PATCH /api/teams/select - Set the user's active team
router.patch('/select', controller.setActiveTeam);

// ---------------------------------------------------------------------------
// Team Member Management
// ---------------------------------------------------------------------------

// POST /api/teams/:teamId/add-user - Add a user to a team
router.post('/:teamId/add-user', controller.addUserToTeam);

// GET /api/teams/:teamId/members - Get all members of a team (requires membership)
router.get('/:teamId/members', controller.getTeamMembers);

// PATCH /api/teams/:teamId/members/:userId/role - Change a member's role (ADMIN only)
router.patch('/:teamId/members/:userId/role', controller.changeMemberRole);

// DELETE /api/teams/:teamId/members/:userId - Remove a member (ADMIN only)
router.delete('/:teamId/members/:userId', controller.removeMember);

// POST /api/teams/:teamId/transfer-ownership - Transfer admin to another member
router.post('/:teamId/transfer-ownership', controller.transferOwnership);

// ---------------------------------------------------------------------------
// Admin Endpoints
// ---------------------------------------------------------------------------

// GET /api/teams/users/all - Get all users in the caller's teams
router.get('/users/all', checkRole(['ADMIN']), controller.getAllUsers);

module.exports = router;
