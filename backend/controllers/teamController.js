// controllers/teamController.js
// Team CRUD and membership management.
// members[] is the SOLE source of truth for roles (see roleRework.md).
// Direct user-adding is deprecated — use POST /api/invites instead.
const Team = require('../models/Team');
const User = require('../models/User');
const Activity = require('../models/Activity');
const socketEmitter = require('../services/socketEmitter');
const { isOwnerEmail } = require('../config/flags');
const { setRoleInOrg, removeFromOrg, countOwners } = require('../services/membership');

// Helper: check if a user has at least one of the given roles in a team's members array
const userHasRoleInTeam = (team, userId, roles) => {
  if (!team || !team.members) return false;
  const membership = team.members.find(m => {
    const mid = m.userId ? m.userId.toString() : m.toString();
    return mid === userId.toString();
  });
  if (!membership) return false;
  const memberRole = membership.role || 'MEMBER';
  // OWNER passes every check (superset of all roles).
  if (memberRole === 'OWNER') return true;
  return roles.includes(memberRole);
};

// Helper: check if user is the adminId of the team (legacy pointer, kept for compat)
const userIsAdminOfTeam = (team, userId) =>
  team.adminId && team.adminId.toString() === userId.toString();

// Helper: OWNER or ADMIN of this team (owner email bypass included).
// Why: most member-management endpoints share this exact check.
const callerIsOwnerOrAdmin = (team, caller) => {
  if (isOwnerEmail(caller.email)) return true;
  if (userIsAdminOfTeam(team, caller._id)) return true;
  return userHasRoleInTeam(team, caller._id, ['OWNER', 'ADMIN']);
};

// POST /api/teams
// Every team belongs to a workspace: orgId is required and the caller must be
// OWNER|ADMIN of THAT org (or platform break-glass). No org-less fallback —
// org-less teams were the entry point of the cross-org join bypass.
const Org = require('../models/Org');
const { getRoleInOrg } = require('../middlewares/orgScope');
exports.createTeam = async (req, res) => {
  try {
    const { name, description, orgId } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Team name required' });
    if (!orgId) return res.status(400).json({ error: 'orgId required' });

    const org = await Org.findById(orgId).select('members').lean();
    if (!org) return res.status(404).json({ error: 'Workspace not found' });

    const callerIsBreakGlass = isOwnerEmail(req.user.email);
    const orgRole = getRoleInOrg(org, req.user._id);
    if (!callerIsBreakGlass && !['OWNER', 'ADMIN'].includes(orgRole)) {
      return res.status(403).json({ error: 'Only workspace OWNER or ADMIN can create teams' });
    }

    const team = await Team.create({
      name: String(name).trim(),
      description,
      orgId,
      ownerId: req.user._id,
      members: [{ userId: req.user._id, role: orgRole || 'ADMIN' }],
    });

    if (!req.user.teamId) {
      req.user.teamId = team._id;
      await req.user.save();
    }

    res.status(201).json({ team, user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team', details: err.message });
  }
};

// GET /api/teams/me
// Returns the user's currently active team with members populated.
exports.getMyTeam = async (req, res) => {
  try {
    if (!req.user.teamId) return res.status(404).json({ error: 'No team assigned' });
    const team = await Team.findById(req.user.teamId)
      .populate('members.userId', 'name email');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

// GET /api/teams?orgId=xxx
// Org-scoped: with orgId returns teams in that workspace (caller must be org member).
// Without orgId, legacy behavior (all teams where caller is admin/member).
exports.listMyTeams = async (req, res) => {
  try {
    const { orgId } = req.query;
    if (orgId) {
      // Isolation: verify org membership first (prevents enumerating other orgs' teams).
      const org = await Org.findById(orgId).select('members').lean();
      if (!org) return res.status(404).json({ error: 'Workspace not found' });
      const callerIsBreakGlass = isOwnerEmail(req.user.email);
      if (!callerIsBreakGlass && !getRoleInOrg(org, req.user._id)) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }
      const teams = await Team.find({ orgId }).populate('members.userId', 'name email');
      return res.json({ teams });
    }
    // Legacy: all teams where user is admin or member.
    const teams = await Team.find({
      $or: [
        { adminId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    }).populate('members.userId', 'name email');
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list teams' });
  }
};

// GET /api/teams/memberships
// Returns ALL teams where the user is a member (including admin).
// Separate from listMyTeams to provide a focused membership endpoint.
exports.getMyMemberships = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { adminId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    }).select('name description adminId members');
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
};

// PATCH /api/teams/select
// Sets the user's active team. User must be admin or member of the team.
// Returns user data including the role from team membership.
exports.setActiveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const isAdmin = userIsAdminOfTeam(team, req.user._id);
    const isMember = team.members && team.members.some(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === req.user._id.toString();
    });

    if (!isAdmin && !isMember) {
      return res.status(403).json({ error: 'Not allowed to select this team. You must be a member or admin.' });
    }

    // Resolve the user's role from team membership and cache it on the user
    req.user.teamId = teamId;
    let resolvedRole = 'MEMBER';
    if (isAdmin) {
      resolvedRole = 'ADMIN';
    } else {
      const membership = team.members.find(m => {
        const mid = m.userId ? m.userId.toString() : m.toString();
        return mid === req.user._id.toString();
      });
      if (membership && membership.role) resolvedRole = membership.role;
    }
    req.user.role = resolvedRole;
    await req.user.save();

    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set active team' });
  }
};

// GET /api/teams/:teamId/members
// Returns all members of a team. Caller must be a member of the team.
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;

    // SECURITY: caller must belong to this team
    const team = await Team.findById(teamId)
      .populate('members.userId', 'name email')
      .populate('adminId', 'name email');
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const isAdmin = userIsAdminOfTeam(team, req.user._id);
    const isMember = team.members && team.members.some(m => {
      const mid = m.userId ? m.userId._id?.toString() || m.userId.toString() : m.toString();
      return mid === req.user._id.toString();
    });
    if (!isAdmin && !isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team.' });
    }

    // Build response: admin + members with roles
    const allMembers = [];
    if (team.adminId) {
      allMembers.push({
        _id: team.adminId._id,
        name: team.adminId.name,
        email: team.adminId.email,
        role: 'ADMIN'
      });
    }

    if (team.members) {
      for (const m of team.members) {
        const memberUser = m.userId || m; // support both old flat IDs and new subdocs
        const memberId = memberUser._id ? memberUser._id.toString() : memberUser.toString();
        // Skip if already added as admin
        if (team.adminId && memberId === team.adminId._id.toString()) continue;
        allMembers.push({
          _id: memberId,
          name: memberUser.name || 'Unknown',
          email: memberUser.email || '',
          role: m.role || 'MEMBER'
        });
      }
    }

    res.json(allMembers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get team members' });
  }
};

// PATCH /api/teams/:teamId/members/:userId/role
// Changes a member's role. Role is org-level, so this updates Org.members and
// every team in the workspace together (no drift). Emits audit log + socket event.
exports.changeMemberRole = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN, MANAGER, or MEMBER.' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only OWNER or ADMIN can change roles (MANAGER removed).
    if (!callerIsOwnerOrAdmin(team, req.user)) {
      return res.status(403).json({ error: 'Only OWNER or ADMIN can change roles' });
    }

    // Only a workspace OWNER (or break-glass) can grant ADMIN.
    if (role === 'ADMIN' && !isOwnerEmail(req.user.email)) {
      const org = await Org.findById(team.orgId).select('members').lean();
      if (getRoleInOrg(org, req.user._id) !== 'OWNER') {
        return res.status(403).json({ error: 'Only the workspace OWNER can grant ADMIN role' });
      }
    }

    const memberEntry = team.members.find(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === userId;
    });
    if (!memberEntry) {
      return res.status(404).json({ error: 'User is not a member of this team' });
    }

    // Never demote the last OWNER of the workspace (bus-factor protection).
    if (role !== 'OWNER' && memberEntry.role === 'OWNER') {
      const owners = await countOwners(team.orgId);
      if (owners <= 1 && !isOwnerEmail(req.user.email)) {
        return res.status(400).json({ error: 'Cannot demote the last OWNER' });
      }
    }

    const oldRole = memberEntry.role || 'MEMBER';
    // Single source: update Org.members + every team in the org at once.
    await setRoleInOrg(team.orgId, userId, role);

    // Update the affected user's cached role if this is their active team
    const affectedUser = await User.findById(userId);
    if (affectedUser && affectedUser.teamId && affectedUser.teamId.toString() === teamId) {
      affectedUser.role = role;
      await affectedUser.save();
    }

    // Log role change activity on the team (system-level audit)
    await Activity.create({
      taskId: null,
      actorId: req.user._id,
      action: 'role_changed',
      details: { teamId, orgId: team.orgId, userId, from: oldRole, to: role }
    });

    // Notify the affected user via socket
    socketEmitter.emitToUser(userId, 'user:role-updated', {
      teamId,
      role,
      previousRole: oldRole
    });

    res.json({ message: 'Role updated', userId, role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change role', details: err.message });
  }
};

// DELETE /api/teams/:teamId/members/:userId
// Removes a member from a team. OWNER or ADMIN only. Never removes last OWNER.
// If this was their only team in the workspace, workspace membership is revoked too.
exports.removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only OWNER or ADMIN can remove members
    if (!callerIsOwnerOrAdmin(team, req.user)) {
      return res.status(403).json({ error: 'Only OWNER or ADMIN can remove members' });
    }

    // Cannot remove yourself (admin)
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot remove yourself. Use transfer-ownership first.' });
    }

    const targetPre = team.members.find((m) => String(m.userId || m) === String(userId));
    if (!targetPre) {
      return res.status(404).json({ error: 'User is not a member of this team' });
    }
    // Never remove the last OWNER of the workspace (bus-factor protection).
    if (targetPre.role === 'OWNER') {
      const owners = await countOwners(team.orgId);
      if (owners <= 1) return res.status(400).json({ error: 'Cannot remove the last OWNER' });
    }

    await Team.updateOne({ _id: teamId }, { $pull: { members: { userId } } });
    // Clear the removed user's active team if it was this team.
    await User.updateOne({ _id: userId, teamId }, { $set: { teamId: null } });

    // If they hold no other team in this workspace, revoke workspace membership
    // too — otherwise a "removed" member keeps org-wide read access.
    const stillInOrg = await Team.exists({ orgId: team.orgId, 'members.userId': userId });
    if (!stillInOrg) await removeFromOrg(team.orgId, userId);

    // Log removal activity
    await Activity.create({
      taskId: null,
      actorId: req.user._id,
      action: 'member_removed',
      details: { teamId, orgId: team.orgId, userId }
    });

    socketEmitter.emitToUser(userId, 'user:removed-from-team', { teamId });

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member', details: err.message });
  }
};

// POST /api/teams/:teamId/transfer-ownership
// Transfers workspace ownership to another member. Old owner becomes MANAGER.
// Updates both Team and Org so the two never disagree.
exports.transferOwnership = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { newAdminId } = req.body;

    if (!newAdminId) {
      return res.status(400).json({ error: 'newAdminId is required' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only OWNER or current ADMIN can transfer ownership
    if (!callerIsOwnerOrAdmin(team, req.user)) {
      return res.status(403).json({ error: 'Only OWNER or ADMIN can transfer ownership' });
    }

    if (String(newAdminId) === String(req.user._id)) {
      return res.status(400).json({ error: 'You are already the owner' });
    }

    // Verify target is a member
    const memberEntry = team.members.find(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === String(newAdminId);
    });
    if (!memberEntry) {
      return res.status(404).json({ error: 'Target user is not a member of this team' });
    }

    const oldOwnerId = team.ownerId || team.adminId || null;

    // Team pointers
    team.ownerId = newAdminId;
    team.adminId = newAdminId;
    await team.save();

    // Keep workspace ownership in lock-step with the team transfer.
    await Org.updateOne({ _id: team.orgId }, { $set: { ownerId: newAdminId } });
    await setRoleInOrg(team.orgId, String(newAdminId), 'OWNER');
    if (oldOwnerId && String(oldOwnerId) !== String(newAdminId)) {
      await setRoleInOrg(team.orgId, String(oldOwnerId), 'MANAGER');
    }

    // Log ownership transfer
    await Activity.create({
      taskId: null,
      actorId: req.user._id,
      action: 'ownership_transferred',
      details: { teamId, orgId: team.orgId, from: oldOwnerId, to: newAdminId }
    });

    // Notify both parties
    if (oldOwnerId) {
      socketEmitter.emitToUser(String(oldOwnerId), 'user:role-updated', { teamId, role: 'MANAGER' });
    }
    socketEmitter.emitToUser(String(newAdminId), 'user:role-updated', { teamId, role: 'OWNER' });

    const updated = await Team.findById(teamId).populate('members.userId', 'name email');
    res.json({ message: 'Ownership transferred', team: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to transfer ownership', details: err.message });
  }
};

// GET /api/teams/users/all
// Returns all users in the database that share a team with the caller.
exports.getAllUsers = async (req, res) => {
  try {
    // Find all distinct teamIds the caller belongs to
    const userTeams = await Team.find({
      $or: [
        { adminId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    }).select('_id');
    const teamIds = userTeams.map(t => t._id);

    const users = await User.find({ teamId: { $in: teamIds } })
      .select('name email _id teamId');

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};
