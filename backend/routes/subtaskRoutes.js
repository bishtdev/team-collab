const express = require('express');
const router = express.Router({ mergeParams: true });
const { createSubtask, getSubtasks, updateSubtask, deleteSubtask } = require('../controllers/subtaskController');
const validate = require('../middlewares/validate');
const { createSubtaskSchema, updateSubtaskSchema } = require('../validators/subtaskValidator');

router.get('/:taskId/subtasks', getSubtasks);
router.post('/:taskId/subtasks', validate(createSubtaskSchema), createSubtask);
router.put('/:taskId/subtasks/:subtaskId', validate(updateSubtaskSchema), updateSubtask);
router.delete('/:taskId/subtasks/:subtaskId', deleteSubtask);

module.exports = router;
