const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createTaskSchema } = require('../validators/taskValidator');
const controller = require('../controllers/taskController');

router.use(auth);

// GET tasks for a project
router.get('/', controller.getTasks);

// Create task (Admin/Manager)
router.post('/', checkRole(['ADMIN', 'MANAGER']), validate(createTaskSchema), controller.createTask);

// Update task
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), controller.updateTask);

// Delete task
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), controller.deleteTask);

module.exports = router;
