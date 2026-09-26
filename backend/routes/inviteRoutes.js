// routes/inviteRoutes.js
// Mounted at /api/invites in server.js.
// - create/list/revoke require Firebase auth + DB user (authenticate).
// - validate/accept are public-ish but require Firebase token (verifyFirebaseToken only),
//   because brand-new users have no DB row yet. Rate-limited strictly.
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const authenticate = require('../middlewares/auth');
const controller = require('../controllers/inviteController');

// Stricter limiter for token endpoints: 20 req / 15min per IP.
// Why: prevents token brute-forcing (tokens are 256-bit so already safe, belt + suspenders).
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many invite attempts, try again later.' },
});

// Public token routes (Firebase token only, no DB user needed for validate).
router.get('/:token/validate', inviteLimiter, controller.validateInvite);
router.post('/:token/accept', inviteLimiter, verifyFirebaseToken, controller.acceptInvite);

// Everything below requires full auth (Firebase + DB user).
router.use(verifyFirebaseToken, authenticate);
router.post('/', controller.createInvite);
router.get('/', controller.listInvites);
router.post('/:id/revoke', controller.revokeInvite);

module.exports = router;
