// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/taskValidator');
const attachmentController = require('../controllers/attachmentController');
const upload = require('../middlewares/upload');
const controller = require('../controllers/taskController');

// All task routes require authentication
router.use(auth);

// GET /api/tasks?projectId=xxx
// Fetches all tasks for a given project
router.get('/', controller.getTasks);

// GET /api/tasks/assigned
// Fetches tasks assigned to the current user
router.get('/assigned', controller.getMyTasks);

// POST /api/tasks
// Creates a new task - only ADMIN and MANAGER can create
router.post('/', checkRole(['ADMIN', 'MANAGER']), validate(createTaskSchema), controller.createTask);

// ---- Attachment Routes ----
// These must be defined before parameterized /:id routes to avoid route conflicts.

// POST /api/tasks/:taskId/attachments
// Upload image attachments to a task
router.post('/:taskId/attachments', checkRole(['ADMIN', 'MANAGER']), upload.array('images', 10), attachmentController.uploadAttachments);

// DELETE /api/tasks/:taskId/attachments/:key
// Delete a specific attachment from a task
router.delete('/:taskId/attachments/:key', checkRole(['ADMIN', 'MANAGER']), attachmentController.deleteAttachment);

// GET /api/tasks/:taskId/attachments
// List all attachments for a task
router.get('/:taskId/attachments', attachmentController.getAttachments);

// PUT /api/tasks/:id
// Updates a task - only ADMIN and MANAGER can update
// Added validation schema for update operations
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), validate(updateTaskSchema), controller.updateTask);

// DELETE /api/tasks/:id
// Deletes a task - only ADMIN and MANAGER can delete
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), controller.deleteTask);

module.exports = router;
