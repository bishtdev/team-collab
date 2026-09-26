// routes/orgRoutes.js — mounted at /api/orgs in server.js.
// - createOrg: open to any authed user (self-serve, Door 1), rate-limited 5/hr.
// - list: my orgs only (isolation — no discovery).
// - :orgId routes: requireOrgMember / requireOrgRole (Org.members truth).
const express = require('express');
const rateLimit = require('express-rate-limit');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const authenticate = require('../middlewares/auth');
const { requireOrgMember, requireOrgRole } = require('../middlewares/orgScope');
const controller = require('../controllers/orgController');

const router = express.Router();

// All org routes need Firebase + DB user first.
router.use(verifyFirebaseToken, authenticate);

// Anti-spam: workspace creation is cheap, limit to 5/hr per IP.
const createOrgLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many workspaces created, try again later.' },
});

router.post('/', createOrgLimiter, controller.createOrg);
router.get('/', controller.listMyOrgs);
router.get('/:orgId', requireOrgMember, controller.getOrg);
router.patch('/:orgId', requireOrgRole(['OWNER']), controller.renameOrg);
router.post('/:orgId/select', requireOrgMember, controller.selectOrg);

module.exports = router;
