const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createTeamSchema } = require('../validators/teamValidator');
const controller = require('../controllers/teamController');

router.use(auth);

// Create team (any authenticated user — becomes ADMIN)
router.post('/', validate(createTeamSchema), controller.createTeam);

// Get my team
router.get('/me', controller.getMyTeam);

router.get('/', controller.listMyTeams);
// Set active team
router.patch('/select', controller.setActiveTeam);

module.exports = router;
