// routes/activityRoutes.js
// Routes for logging and reading task activities with input validation.
const express = require('express');
const router = express.Router({ mergeParams: true });
const { createActivity, getActivities } = require('../controllers/activityController');
const validate = require('../middlewares/validate');
const { createActivitySchema } = require('../validators/activityValidator');

// Create an activity for a task (validated)
router.post('/:taskId/activities', validate(createActivitySchema), createActivity);
// Get activities for a task (pagination)
router.get('/:taskId/activities', getActivities);

module.exports = router;
