// controllers/teamController.js
const Team = require('../models/Team');
const User = require('../models/User');

// POST /api/teams
// Creates a new team and makes the current user the admin.
// The creator is automatically added to the team's members list.
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check for duplicate team names owned by the same admin
    const existingTeam = await Team.findOne({ name, adminId: req.user._id });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team with this name already exists for you' });
    }

    // Create the team with the current user as admin and first member
    const team = await Team.create({
      name,
      description,
      adminId: req.user._id,
      members: [req.user._id]
    });

    // If user has no active team yet, set this as their current team
    if (!req.user.teamId) {
      req.user.teamId = team._id;
      req.user.role = 'ADMIN'; // Creator becomes admin
      await req.user.save();
    }

    res.status(201).json({ team, user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team', details: err.message });
  }
};

// GET /api/teams/me
// Returns the user's currently active team.
exports.getMyTeam = async (req, res) => {
  try {
    if (!req.user.teamId) return res.status(404).json({ error: 'No team assigned' });
    const team = await Team.findById(req.user.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

// GET /api/teams
// Lists all teams where the current user is the admin.
exports.listMyTeams = async (req, res) => {
  try {
    const owned = await Team.find({ adminId: req.user._id })
      .populate('members', 'name email role');
    res.json({ teams: owned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list teams' });
  }
};

// PATCH /api/teams/select
// Sets the user's active team.
// The user must be either the admin of the team OR a member of the team.
// This allows members to switch between teams they belong to.
exports.setActiveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Check if user is the admin of this team
    const isAdmin = String(team.adminId) === String(req.user._id);

    // Check if user is a member of this team
    const isMember = team.members && team.members.some(
      memberId => String(memberId) === String(req.user._id)
    );

    // User must be either admin or member to switch to this team
    if (!isAdmin && !isMember) {
      return res.status(403).json({ error: 'Not allowed to select this team. You must be a member or admin.' });
    }

    // Update user's active team
    req.user.teamId = teamId;
    await req.user.save();

    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set active team' });
  }
};

// POST /api/teams/:teamId/add-user
// Adds a user to a team. Only ADMIN and MANAGER roles can do this.
// Supports adding existing users by ID or creating new users by email.
exports.addUserToTeam = async (req, res) => {
  try {
    const { email, name, userId } = req.body;
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    let user;

    if (userId) {
      // Adding an existing user by their ID
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else if (email) {
      // Check if user exists by email
      user = await User.findOne({ email });

      if (!user) {
        // Create a new user record if they don't exist yet
        // This handles the case where you invite someone who hasn't signed up
        user = await User.create({
          email,
          name,
          role: 'MEMBER',
          teamId: teamId
        });
      }
    } else {
      return res.status(400).json({ error: 'Either userId or email is required' });
    }

    // Check if user is already in the team
    if (team.members && team.members.includes(user._id)) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }

    // Update user's teamId if not already set
    if (!user.teamId) {
      user.teamId = teamId;
      await user.save();
    }

    // Add user to team's members array
    if (!team.members) {
      team.members = [];
    }

    if (!team.members.includes(user._id)) {
      team.members.push(user._id);
      await team.save();
    }

    res.status(200).json({ message: 'User added to team', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign user to team', details: err.message });
  }
};

// GET /api/teams/:teamId/members
// Returns all members of a team, including the admin.
// Deduplicates the admin from the members list if they appear in both.
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate('members', 'name email role');
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Get admin user details separately
    const admin = await User.findById(team.adminId).select('name email role');

    // Combine admin and members, avoiding duplicates
    let allMembers = [];
    if (admin) {
      allMembers.push(admin);
    }

    if (team.members && team.members.length > 0) {
      // Filter out admin if they're already in members array
      const membersWithoutAdmin = team.members.filter(member =>
        !admin || member._id.toString() !== admin._id.toString()
      );
      allMembers = [...allMembers, ...membersWithoutAdmin];
    }

    res.json(allMembers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get team members' });
  }
};

// GET /api/teams/users/all
// Returns all users in the database.
// This endpoint is restricted to ADMIN role only (see route definition).
// Used by admins to find users to add to their teams.
exports.getAllUsers = async (req, res) => {
  try {
    // Only return users from the same team for non-super-admin users
    // This prevents leaking user data across teams
    const users = await User.find({ teamId: req.user.teamId })
      .select('name email role _id teamId');

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};
