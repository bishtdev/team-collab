// scripts/migrate-single-to-orgs.js
// One-time: single-workspace → multi-org.
// Usage: node scripts/migrate-single-to-orgs.js [--apply] (default dry-run)
// Strategy (default SINGLE org, preserves sharing):
// - Creates one Org "Legacy Workspace" owned by first ADMIN_EMAILS user (or first team owner/admin).
// - Moves ALL existing Team.members (+ legacy adminId/ownerId) → Org.members (highest role wins).
// - Backfills Team.orgId, Project.orgId (via Team), Invite.orgId (via Team).
// - Sets User.lastActiveOrgId for members.
// Idempotent: re-running only adds missing members / upgrades lower roles, never downgrades.
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Org = require('../models/Org');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { flags } = require('../config/flags');

const apply = process.argv.includes('--apply');
const RANK = { MEMBER: 0, MANAGER: 1, ADMIN: 2, OWNER: 3 };

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI);

  const teams = await Team.find({}).lean();
  const users = await User.find({}).select('_id email').lean();
  console.log(`Teams: ${teams.length}, Users: ${users.length}. Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  if (teams.length === 0) {
    console.log('No teams — nothing to migrate.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Pick org owner: first ADMIN_EMAILS user found, else first team ownerId/adminId/member.
  let ownerId = null;
  for (const em of flags.ADMIN_EMAILS) {
    const found = users.find((u) => String(u.email).toLowerCase() === em);
    if (found) {
      ownerId = found._id;
      break;
    }
  }
  if (!ownerId) {
    ownerId = teams.find((t) => t.ownerId)?.ownerId
      || teams.find((t) => t.adminId)?.adminId
      || teams[0].members?.[0]?.userId;
  }
  if (!ownerId) throw new Error('Cannot determine org owner (no users/teams)');

  // Merge all team members → org members (highest role wins). Includes legacy
  // adminId/ownerId pointers that may not appear in members[] — otherwise those
  // admins silently lose access after migration.
  const byUser = new Map();
  const upsertMember = (uid, role) => {
    if (!uid || !mongoose.Types.ObjectId.isValid(String(uid))) return;
    const key = String(uid);
    const prev = byUser.get(key);
    if (!prev || RANK[role] > RANK[prev.role]) {
      byUser.set(key, { userId: new mongoose.Types.ObjectId(key), role });
    }
  };
  for (const t of teams) {
    for (const m of t.members || []) {
      upsertMember(m.userId ? String(m.userId) : String(m), m.role || 'MEMBER');
    }
    if (t.adminId) upsertMember(t.adminId, 'ADMIN');
    if (t.ownerId) upsertMember(t.ownerId, 'OWNER');
  }
  upsertMember(ownerId, 'OWNER');

  // Find or create legacy org.
  let org = await Org.findOne({ slug: 'legacy-workspace' });
  if (!org) {
    console.log('Will create Org with', byUser.size, 'members, owner', String(ownerId));
    if (apply) {
      org = await Org.create({
        name: process.env.LEGACY_ORG_NAME || 'Legacy Workspace',
        slug: 'legacy-workspace',
        ownerId,
        members: [...byUser.values()],
      });
      console.log('Created org:', org._id.toString());
    }
  } else {
    console.log('Using existing org:', org.name, org._id.toString());
    if (apply) {
      // Merge members: add missing, upgrade lower roles (never downgrade).
      const existing = new Map(
        (org.members || []).map((m) => [String(m.userId), m.role || 'MEMBER'])
      );
      const toAdd = [];
      for (const e of byUser.values()) {
        const cur = existing.get(String(e.userId));
        if (!cur) {
          toAdd.push(e);
        } else if (RANK[e.role] > RANK[cur]) {
          await Org.updateOne(
            { _id: org._id, 'members.userId': e.userId },
            { $set: { 'members.$.role': e.role } }
          );
        }
      }
      if (toAdd.length) {
        await Org.updateOne({ _id: org._id }, { $push: { members: { $each: toAdd } } });
        console.log(`Added ${toAdd.length} missing members to org.`);
      }
    }
  }

  // The org these rows will belong to (dry-run: planned id, may be null).
  const plannedOrgId = org ? org._id : null;

  // Backfill Team.orgId where missing.
  const teamsMissing = teams.filter((t) => !t.orgId);
  console.log(`${teamsMissing.length} teams missing orgId.`);
  if (apply && teamsMissing.length && plannedOrgId) {
    await Team.updateMany(
      { _id: { $in: teamsMissing.map((t) => t._id) } },
      { $set: { orgId: plannedOrgId } }
    );
    console.log('Backfilled Team.orgId.');
  }

  // team → orgId map using the POST-backfill value, so project/invite backfill
  // uses each team's real org instead of a blanket fallback.
  const teamOrgIdById = new Map(
    teams.map((t) => [String(t._id), t.orgId || plannedOrgId])
  );

  // Backfill Project.orgId via Team.
  const projects = await Project.find({ $or: [{ orgId: null }, { orgId: { $exists: false } }] })
    .select('_id teamId').lean();
  console.log(`${projects.length} projects missing orgId.`);
  if (apply && projects.length && plannedOrgId) {
    let fixed = 0;
    for (const p of projects) {
      const oid = teamOrgIdById.get(String(p.teamId)) || plannedOrgId;
      await Project.updateOne({ _id: p._id }, { $set: { orgId: oid } });
      fixed += 1;
    }
    console.log(`Backfilled ${fixed} Project.orgId.`);
  }

  // Backfill Invite.orgId via Team (legacy invites without orgId).
  let invitesMissing = [];
  try {
    invitesMissing = await Invite.find({ $or: [{ orgId: null }, { orgId: { $exists: false } }] })
      .select('_id teamId').lean();
  } catch {
    invitesMissing = [];
  }
  console.log(`${invitesMissing.length} invites missing orgId.`);
  if (apply && invitesMissing.length && plannedOrgId) {
    for (const inv of invitesMissing) {
      const oid = teamOrgIdById.get(String(inv.teamId)) || plannedOrgId;
      await Invite.updateOne({ _id: inv._id }, { $set: { orgId: oid } });
    }
    console.log('Backfilled Invite.orgId.');
  }

  // Point members at the legacy org if they have no active org.
  if (apply && plannedOrgId) {
    const memberIds = [...byUser.keys()].map((id) => new mongoose.Types.ObjectId(id));
    const r = await User.updateMany(
      { _id: { $in: memberIds }, $or: [{ lastActiveOrgId: null }, { lastActiveOrgId: { $exists: false } }] },
      { $set: { lastActiveOrgId: plannedOrgId } }
    );
    console.log(`Pointed ${r.modifiedCount} users at legacy org.`);
  }

  console.log(`\nDone. ${apply ? 'Applied.' : 'Run with --apply to write.'}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error('migrate-single-to-orgs failed:', e);
  process.exit(1);
});
