// config/flags.js
// Central feature flags. All gates read from here so behavior can be flipped
// via env without code changes. Env must be loaded before this module (server.js
// calls dotenv first) or these values silently fall back to defaults.

const parseBool = (v, fallback) => {
  if (v === undefined || v === null || v === '') return fallback;
  return ['true', '1', 'yes'].includes(String(v).toLowerCase());
};

// Invite TTL must be a positive number; fall back to 48h on anything else
// (a NaN TTL would make every invite comparison false → non-expiring invites).
const parseTtlHours = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 48;
};

const flags = {
  // Self-serve workspace creation (Door 1).
  // false = closed beta, only break-glass (ADMIN_EMAILS) can create orgs.
  ALLOW_ORG_CREATION: parseBool(process.env.ALLOW_ORG_CREATION, true),

  INVITE_TTL_HOURS: parseTtlHours(process.env.INVITE_TTL_HOURS),

  // Comma-separated owner emails, e.g. "you@co.com,backup@co.com"
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};

const isOwnerEmail = (email) => {
  if (!email) return false;
  return flags.ADMIN_EMAILS.includes(String(email).toLowerCase());
};

module.exports = { flags, isOwnerEmail };
