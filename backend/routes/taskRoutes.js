// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/taskValidator');
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

// PUT /api/tasks/:id
// Updates a task - only ADMIN and MANAGER can update
// Added validation schema for update operations
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), validate(updateTaskSchema), controller.updateTask);

// DELETE /api/tasks/:id
// Deletes a task - only ADMIN and MANAGER can delete
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), controller.deleteTask);

module.exports = router;
