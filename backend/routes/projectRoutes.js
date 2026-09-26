const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/role');
const { createProjectSchema } = require('../validators/projectValidator');
const validate = require('../middlewares/validate'); // We'll create this
const controller = require('../controllers/projectController');
const Project = require('../models/Project');

// Middleware to validate body
// (create `middlewares/validate.js`)
router.use(auth);

// Get all projects
router.get('/', controller.getProjects);

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      teamId: req.user.teamId
    });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create a project (Owner/Admin/Manager — OWNER is workspace owner via org bootstrap)
router.post(
  '/',
  checkRole(['OWNER', 'ADMIN', 'MANAGER']),
  validate(createProjectSchema),
  controller.createProject
);

// Update a project (Owner/Admin/Manager)
router.put(
  '/:id',
  checkRole(['OWNER', 'ADMIN', 'MANAGER']),
  validate(createProjectSchema),
  controller.updateProject
);

// Delete a project (Owner/Admin only)
router.delete(
  '/:id',
  checkRole(['OWNER', 'ADMIN']),
  controller.deleteProject
);

module.exports = router;
