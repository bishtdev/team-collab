// scripts/migrate-team-members.js
// One-time migration: converts Team.members from flat [ObjectId] to
// embedded [{ userId: ObjectId, role: String }] subdocuments.
//
// Run: node scripts/migrate-team-members.js
// Requires: MongoDB connection via MONGO_URI in .env
//
// Before running:
//   Back up the teams collection or note the count.
//   This script is idempotent — running it again will skip already-converted members.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Team = require('../models/Team');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const teams = await Team.find({});
    console.log(`Found ${teams.length} teams`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const team of teams) {
      let needsMigration = false;
      const newMembers = [];

      for (const member of team.members || []) {
        // Extract the actual userId ObjectId, handling various shapes:
        // - Already migrated: { userId: ObjectId, role: 'ADMIN' }
        // - Populated subdoc: { userId: { _id: ObjectId, name, email }, role: '...' }
        // - Flat populated: { _id: ObjectId, name, email, role: '...' }
        // - Flat ObjectId: just an ObjectId string
        let extractedId = null;
        let extractedRole = null;

        if (member.userId) {
          // Has userId sub-field: either migrated or populated within subdoc
          extractedId = member.userId._id || member.userId;
          extractedRole = member.role || 'MEMBER';
        } else if (member._id) {
          // Populated User object (from .populate) — extract the ObjectId
          extractedId = member._id;
          extractedRole = member.role || 'MEMBER';
        } else {
          // Plain ObjectId string
          extractedId = member.toString();
          extractedRole = 'MEMBER';
        }

        const memberStr = extractedId.toString();
        const isAdmin = team.adminId && team.adminId.toString() === memberStr;
        // Preserve ADMIN role from populated data or override based on adminId
        const role = isAdmin ? 'ADMIN' : (extractedRole || 'MEMBER');

        newMembers.push({ userId: extractedId, role });
        // Mark as needing migration unless it already has the userId shape
        if (!member.userId || member.userId._id) {
          needsMigration = true;
        }
      }

      // Ensure the admin is in members if not already present
      if (team.adminId) {
        const adminInMembers = newMembers.some(
          m => (m.userId._id || m.userId).toString() === team.adminId.toString()
        );
        if (!adminInMembers) {
          newMembers.push({ userId: team.adminId, role: 'ADMIN' });
          needsMigration = true;
        }
      }

      if (needsMigration) {
        await Team.updateOne(
          { _id: team._id },
          { $set: { members: newMembers } }
        );
        migratedCount++;
        console.log(`  Migrated team "${team.name}" (${team._id})`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\nMigration complete: ${migratedCount} migrated, ${skippedCount} already up-to-date`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
