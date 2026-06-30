// controllers/teamController.js
// Team CRUD and membership management.
// Roles are per-team via embedded members[].role subdocument (Phase 2 model).
const Team = require('../models/Team');
const User = require('../models/User');
const Activity = require('../models/Activity');
const socketEmitter = require('../services/socketEmitter');

// Helper: check if a user has at least one of the given roles in a team's members array
const userHasRoleInTeam = (team, userId, roles) => {
  if (!team || !team.members) return false;
  const membership = team.members.find(m => {
    const mid = m.userId ? m.userId.toString() : m.toString();
    return mid === userId.toString();
  });
  if (!membership) return false;
  const memberRole = membership.role || 'MEMBER';
  return roles.includes(memberRole);
};

// Helper: check if user is the adminId of the team
const userIsAdminOfTeam = (team, userId) =>
  team.adminId && team.adminId.toString() === userId.toString();

// POST /api/teams
// Creates a new team. Creator becomes ADMIN and is added to members[].
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingTeam = await Team.findOne({ name, adminId: req.user._id });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team with this name already exists for you' });
    }

    // Create team with creator as admin + first member with ADMIN role
    const team = await Team.create({
      name,
      description,
      adminId: req.user._id,
      members: [{ userId: req.user._id, role: 'ADMIN' }]
    });

    // If user has no active team yet, set this as their current team and cache ADMIN role
    if (!req.user.teamId) {
      req.user.teamId = team._id;
      req.user.role = 'ADMIN';
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

// GET /api/teams
// Lists all teams where the user is an admin OR a member.
// After Phase 2: uses embedded members[].userId for lookup.
exports.listMyTeams = async (req, res) => {
  try {
    // Find teams where user is admin or a member
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

// POST /api/teams/:teamId/add-user
// Adds a user to a team. Caller must be ADMIN or MANAGER of the target team.
// Uses atomic $addToSet to prevent duplicate additions (fixes race condition).
exports.addUserToTeam = async (req, res) => {
  try {
    const { email, name, userId } = req.body;
    const { teamId } = req.params;

    // Load team to verify caller's ownership/membership
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // SECURITY: caller must belong to this team as ADMIN or MANAGER
    const callerIsAdmin = userIsAdminOfTeam(team, req.user._id);
    const callerHasRole = userHasRoleInTeam(team, req.user._id, ['ADMIN', 'MANAGER']);
    if (!callerIsAdmin && !callerHasRole) {
      return res.status(403).json({ error: 'You do not have permission to add members to this team' });
    }

    let user;
    if (userId) {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
    } else if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ email, name, role: 'MEMBER' });
      }
    } else {
      return res.status(400).json({ error: 'Either userId or email is required' });
    }

    // Atomic add-to-set: prevents duplicates even with concurrent requests
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: teamId, 'members.userId': { $ne: user._id } },
      { $push: { members: { userId: user._id, role: 'MEMBER' } } },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }

    // Set user's active team if not already set (first-time team join)
    if (!user.teamId) {
      user.teamId = teamId;
      await user.save();
    }

    res.status(200).json({ message: 'User added to team', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign user to team', details: err.message });
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
// Changes a member's role. ADMIN only. Emits audit log + socket event.
exports.changeMemberRole = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN, MANAGER, or MEMBER.' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only ADMIN can change roles
    if (!userIsAdminOfTeam(team, req.user._id)) {
      return res.status(403).json({ error: 'Only the team admin can change member roles' });
    }

    // Find the target member in the members array
    const memberEntry = team.members.find(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === userId;
    });
    if (!memberEntry) {
      return res.status(404).json({ error: 'User is not a member of this team' });
    }

    const oldRole = memberEntry.role || 'MEMBER';
    memberEntry.role = role;
    await team.save();

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
      details: { teamId, userId, from: oldRole, to: role }
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
// Removes a member from a team. ADMIN only.
exports.removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only ADMIN can remove members
    if (!userIsAdminOfTeam(team, req.user._id)) {
      return res.status(403).json({ error: 'Only the team admin can remove members' });
    }

    // Cannot remove yourself (admin)
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot remove yourself. Use transfer-ownership first.' });
    }

    const before = team.members.length;
    team.members = team.members.filter(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid !== userId;
    });

    if (team.members.length === before) {
      return res.status(404).json({ error: 'User is not a member of this team' });
    }

    await team.save();

    // Clear the removed user's active team if it was this team
    await User.findByIdAndUpdate(userId, { teamId: null });

    // Log removal activity
    await Activity.create({
      taskId: null,
      actorId: req.user._id,
      action: 'member_removed',
      details: { teamId, userId }
    });

    socketEmitter.emitToUser(userId, 'user:removed-from-team', { teamId });

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member', details: err.message });
  }
};

// POST /api/teams/:teamId/transfer-ownership
// Transfers admin ownership to another member. Old admin becomes MANAGER.
exports.transferOwnership = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { newAdminId } = req.body;

    if (!newAdminId) {
      return res.status(400).json({ error: 'newAdminId is required' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only current ADMIN can transfer ownership
    if (!userIsAdminOfTeam(team, req.user._id)) {
      return res.status(403).json({ error: 'Only the team admin can transfer ownership' });
    }

    if (newAdminId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You are already the admin' });
    }

    // Verify target is a member
    const memberEntry = team.members.find(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === newAdminId;
    });
    if (!memberEntry) {
      return res.status(404).json({ error: 'Target user is not a member of this team' });
    }

    // Perform transfer: old admin → MANAGER, new admin → ADMIN
    const oldAdminId = team.adminId;
    team.adminId = newAdminId;

    // Update old admin's role in members to MANAGER
    const oldAdminMembership = team.members.find(m => {
      const mid = m.userId ? m.userId.toString() : m.toString();
      return mid === oldAdminId.toString();
    });
    if (oldAdminMembership) oldAdminMembership.role = 'MANAGER';

    // Update new admin's role to ADMIN
    memberEntry.role = 'ADMIN';

    await team.save();

    // Log ownership transfer
    await Activity.create({
      taskId: null,
      actorId: req.user._id,
      action: 'ownership_transferred',
      details: { teamId, from: oldAdminId, to: newAdminId }
    });

    // Notify both parties
    socketEmitter.emitToUser(oldAdminId.toString(), 'user:role-updated', { teamId, role: 'MANAGER' });
    socketEmitter.emitToUser(newAdminId, 'user:role-updated', { teamId, role: 'ADMIN' });

    res.json({ message: 'Ownership transferred', team });
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
