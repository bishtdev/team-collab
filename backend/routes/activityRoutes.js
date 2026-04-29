// routes/activityRoutes.js
// Routes for logging and reading task activities (MVP)
const express = require('express');
const router = express.Router({ mergeParams: true });
const { createActivity, getActivities } = require('../controllers/activityController');

// Create an activity for a task
router.post('/:taskId/activities', createActivity);
// Get activities for a task (pagination)
router.get('/:taskId/activities', getActivities);

module.exports = router;
