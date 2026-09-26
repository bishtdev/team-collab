// scripts/seed-admin.js
// Idempotent break-glass owner seeder. Run: npm run seed:admin
// Steps:
// 1. Reads ADMIN_EMAILS env (comma-separated).
// 2. Upserts a User per email (never clobbers an existing name).
// 3. Ensures a workspace Org exists and adds each owner to Org.members as OWNER.
// 4. Ensures a team exists inside that org and mirrors the owner into Team.members.
// Safe to re-run: every step is find-or-add, never duplicates.
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Team = require('../models/Team');
const Org = require('../models/Org');
const { flags } = require('../config/flags');

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  if (flags.ADMIN_EMAILS.length === 0) {
    console.log('No ADMIN_EMAILS set — nothing to seed. Set ADMIN_EMAILS=you@co.com');
    process.exit(0);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Owners to seed:', flags.ADMIN_EMAILS);

  // 1) Upsert owner users (name only on insert).
  const owners = [];
  for (const email of flags.ADMIN_EMAILS) {
    const user = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, name: email.split('@')[0], role: 'ADMIN' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    owners.push(user);
    console.log('Upserted user:', user.email, user._id.toString());
  }

  // 2) Ensure the workspace Org exists (teams require an orgId).
  let org = await Org.findOne({ slug: 'legacy-workspace' });
  if (!org) {
    org = await Org.create({
      name: process.env.LEGACY_ORG_NAME || process.env.FIRST_TEAM_NAME || 'Workspace',
      slug: 'legacy-workspace',
      ownerId: owners[0]._id,
      members: [{ userId: owners[0]._id, role: 'OWNER' }],
    });
    console.log('Created org:', org.name, org._id.toString());
  } else {
    console.log('Using org:', org.name, org._id.toString());
  }

  // 3) Ensure a default team exists inside the org (name lookup scoped to the org
  // so it can never grab another workspace's same-named team).
  const teamName = process.env.FIRST_TEAM_NAME || 'Workspace';
  let team = await Team.findOne({ orgId: org._id, name: teamName });
  if (!team) {
    team = await Team.create({
      name: teamName,
      description: 'Default workspace team',
      orgId: org._id,
      ownerId: owners[0]._id,
    });
    console.log('Created team:', team.name, team._id.toString());
  } else {
    console.log('Using team:', team.name, team._id.toString());
  }

  // 4) Make every owner an OWNER in both collections (mirrored, no drift).
  for (const user of owners) {
    await Org.updateOne(
      { _id: org._id, 'members.userId': { $ne: user._id } },
      { $push: { members: { userId: user._id, role: 'OWNER' } } }
    );
    await Org.updateOne(
      { _id: org._id, 'members.userId': user._id },
      { $set: { 'members.$.role': 'OWNER' } }
    );
    await Team.updateOne(
      { _id: team._id, 'members.userId': { $ne: user._id } },
      { $push: { members: { userId: user._id, role: 'OWNER' } } }
    );
    await Team.updateOne(
      { _id: team._id, 'members.userId': user._id },
      { $set: { 'members.$.role': 'OWNER' } }
    );

    if (!user.teamId) user.teamId = team._id;
    user.role = 'ADMIN'; // cached copy for old UI; not used for authz
    user.lastActiveOrgId = org._id;
    await user.save();
    console.log(`Ensured ${user.email} is OWNER in org + team`);
  }

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error('seed-admin failed:', e);
  process.exit(1);
});
