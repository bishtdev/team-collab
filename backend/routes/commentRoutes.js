// routes/commentRoutes.js
// Routes for managing task comments with input validation.
const express = require('express');
const router = express.Router({ mergeParams: true });
const { createComment, getComments } = require('../controllers/commentController');
const validate = require('../middlewares/validate');
const { createCommentSchema } = require('../validators/commentValidator');

// Create a new comment for a task (validated)
router.post('/:taskId/comments', validate(createCommentSchema), createComment);
// Get comments for a task with pagination
router.get('/:taskId/comments', getComments);

module.exports = router;
