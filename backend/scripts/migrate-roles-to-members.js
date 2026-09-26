// scripts/migrate-roles-to-members.js
// One-time backfill to single-source roles (members[]).
// Usage: node scripts/migrate-roles-to-members.js [--dry-run|--apply] (default dry-run)
// What it fixes per team:
// 1. ownerId fallback: if empty, use adminId.
// 2. Converts legacy flat members (["63...","63..."]) to [{userId, role}] subdocs.
// 3. Ensures ownerId + adminId users exist inside members[] (adds missing).
// 4. Ensures ADMIN_EMAILS users are OWNER in every team they belong to.
// 5. Dedupes members[] by userId (keeps highest privilege: OWNER>ADMIN>MANAGER>MEMBER).
// 6. Prints diff; only writes on --apply (via updateOne to avoid Mongoose cast issues).
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Team = require('../models/Team');
const User = require('../models/User');
const { flags } = require('../config/flags');

const RANK = { MEMBER: 0, MANAGER: 1, ADMIN: 2, OWNER: 3 };
const apply = process.argv.includes('--apply');

// Extract a userId string from any legacy shape:
// - "63..." string / ObjectId -> itself
// - {userId: X, role} subdoc -> X
// - Mongoose subdoc built from a flat id (no userId, but _id/buffer) -> best-effort fallback
const extractUserId = (m) => {
  if (!m) return null;
  // Plain string or ObjectId instance (has toHexString / buffer)
  if (typeof m === 'string') return m;
  if (m instanceof mongoose.Types.ObjectId) return String(m);
  if (typeof m === 'object') {
    if (m.userId) {
      // userId itself could be populated object { _id } or ObjectId
      if (typeof m.userId === 'object' && m.userId._id) return String(m.userId._id);
      return String(m.userId);
    }
    // Legacy flat ObjectId arrived as object (e.g. lean gives ObjectId, docs give subdoc).
    // If it looks like an ObjectId (has buffer/toHexString), use it directly.
    if (typeof m.toHexString === 'function') {
      try {
        return m.toHexString();
      } catch {
        /* fall through */
      }
    }
    if (m._id && typeof m._id !== 'object') return String(m._id);
    if (m.buffer) {
      // Last resort: this is a raw BSON ObjectId-like; let ObjectId() stringify it.
      try {
        return String(new mongoose.Types.ObjectId(m));
      } catch {
        return null;
      }
    }
  }
  // Fallback: _id field on weird subdocs (only if valid ObjectId string)
  return null;
};

const isValidId = (s) => mongoose.Types.ObjectId.isValid(s);

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI);
  // Use lean() to get RAW db shapes (flat strings stay strings).
  // Why: Mongoose docs auto-cast legacy flat ids into subdocs and corrupt them.
  const teams = await Team.find({}).lean();
  console.log(`Found ${teams.length} teams. Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  let touched = 0;
  for (const team of teams) {
    const changes = [];
    let ownerId = team.ownerId ? String(team.ownerId) : null;
    const adminId = team.adminId ? String(team.adminId) : null;
    if (!ownerId && adminId) {
      ownerId = adminId;
      changes.push(`ownerId := adminId ${adminId}`);
    }

    // Normalize every member entry to { userId, role }.
    const byUser = new Map();
    for (const m of team.members || []) {
      const uid = extractUserId(m);
      if (!uid || !isValidId(uid)) {
        changes.push(`skip unparseable member ${JSON.stringify(m)?.slice(0, 80)}`);
        continue;
      }
      // Role: subdocs carry it; flat ids default to MEMBER (adminId upgraded below).
      const role = typeof m === 'object' && m.role ? m.role : 'MEMBER';
      const joinedAt = typeof m === 'object' ? m.joinedAt : undefined;
      const key = String(uid);
      if (!byUser.has(key) || RANK[role] > RANK[byUser.get(key).role]) {
        if (byUser.has(key)) changes.push(`dedupe ${key} (kept ${role}, dropped ${byUser.get(key).role})`);
        byUser.set(key, { userId: new mongoose.Types.ObjectId(uid), role, ...(joinedAt ? { joinedAt } : {}) });
      } else {
        changes.push(`dedupe ${key} (kept ${byUser.get(key).role}, dropped ${role})`);
      }
      // Flat entry that equals adminId gets ADMIN (legacy teams stored no roles).
      if (adminId && key === adminId && byUser.get(key).role === 'MEMBER') {
        byUser.get(key).role = 'ADMIN';
        changes.push(`upgrade admin ${key} MEMBER -> ADMIN (legacy flat entry)`);
      }
    }

    // Ensure ownerId/adminId present in members.
    for (const [label, id, role] of [
      ['ownerId', ownerId, 'OWNER'],
      ['adminId', adminId, 'ADMIN'],
    ]) {
      if (id && isValidId(id) && !byUser.has(String(id))) {
        byUser.set(String(id), { userId: new mongoose.Types.ObjectId(id), role });
        changes.push(`added missing ${label} ${id} as ${role}`);
      }
    }

    const next = [...byUser.values()];
    // Upgrade ADMIN_EMAILS members to OWNER (email lookup).
    const memberIds = next.map((e) => e.userId);
    const users = await User.find({ _id: { $in: memberIds } }).select('_id email').lean();
    const emailById = new Map(users.map((u) => [String(u._id), String(u.email).toLowerCase()]));
    for (const e of next) {
      const em = emailById.get(String(e.userId));
      if (em && flags.ADMIN_EMAILS.includes(em) && e.role !== 'OWNER') {
        changes.push(`upgrade ${em} to OWNER (was ${e.role})`);
        e.role = 'OWNER';
      }
    }

    const needsWrite =
      changes.length > 0 || (team.members || []).length !== next.length;
    if (needsWrite) {
      console.log(`\nTeam ${team.name} (${team._id}):`);
      changes.forEach((c) => console.log('  -', c));
      touched += 1;
      if (apply) {
        // updateOne with raw object avoids Mongoose subdoc casting bugs.
        await Team.updateOne(
          { _id: team._id },
          { $set: { members: next, ...(ownerId ? { ownerId: new mongoose.Types.ObjectId(ownerId) } : {}) } }
        );
        console.log('  saved.');
      }
    }
  }
  console.log(`\n${touched} teams need changes. ${apply ? 'Applied.' : 'Run with --apply to write.'}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error('migrate failed:', e);
  process.exit(1);
});
