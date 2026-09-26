// services/membership.js
// Single owner of "who has what role in a workspace".
// Org.members is the truth; Team.members mirrors it so team-scoped guards
// (checkRole, socket rooms) keep working. Every role/removal mutation routes
// through here so the two collections can never drift — drift is what let a
// demoted admin keep org powers and a removed member keep org-wide read.
const Org = require('../models/Org');
const Team = require('../models/Team');

// Add a member to the workspace only if absent. Never changes an existing role
// (joining via invite must never downgrade a current OWNER/ADMIN).
const addToOrg = async (orgId, userId, role) => {
  const res = await Org.updateOne(
    { _id: orgId, 'members.userId': { $ne: userId } },
    { $push: { members: { userId, role } } }
  );
  return res.modifiedCount > 0;
};

// Set a member's role in the org AND in every team of that org (role is org-level).
const setRoleInOrg = async (orgId, userId, role) => {
  await Promise.all([
    Org.updateOne(
      { _id: orgId, 'members.userId': userId },
      { $set: { 'members.$.role': role } }
    ),
    Team.updateMany(
      { orgId, 'members.userId': userId },
      { $set: { 'members.$.role': role } }
    ),
  ]);
};

// Remove a member from the workspace entirely (org + all its teams).
const removeFromOrg = async (orgId, userId) => {
  await Promise.all([
    Org.updateOne({ _id: orgId }, { $pull: { members: { userId } } }),
    Team.updateMany({ orgId }, { $pull: { members: { userId } } }),
  ]);
};

// Count OWNERs in a workspace (used for last-OWNER protection).
const countOwners = async (orgId) =>
  Org.countDocuments({ _id: orgId, 'members.role': 'OWNER' });

module.exports = { addToOrg, setRoleInOrg, removeFromOrg, countOwners };
