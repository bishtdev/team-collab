// routes/commentRoutes.js
// Routes for managing task comments (MVP)
const express = require('express');
const router = express.Router({ mergeParams: true });
const { createComment, getComments } = require('../controllers/commentController');

// Create a new comment for a task
router.post('/:taskId/comments', createComment);
// Get comments for a task with pagination
router.get('/:taskId/comments', getComments);

module.exports = router;
