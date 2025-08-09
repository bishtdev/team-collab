const Team = require('../models/Team');
const User = require('../models/User');

// Create a team and make current user admin
// controllers/teamController.js
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Optional: prevent duplicate team names for same admin
    const existingTeam = await Team.findOne({ name, adminId: req.user._id });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team with this name already exists for you' });
    }

    const team = await Team.create({
      name,
      description,
      adminId: req.user._id,
      members: [req.user._id] // Include admin in members array
    });

    // If user has no active team yet, set this as their current team
    if (!req.user.teamId) {
      req.user.teamId = team._id;
      req.user.role = 'ADMIN'; // ensure role
      await req.user.save();
    }

    res.status(201).json({ team, user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team', details: err.message });
  }
};


// Get current user's team
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

// in teamController.js
exports.listMyTeams = async (req, res) => {
  try {
    // Admin: teams where they are admin
    const owned = await Team.find({ adminId: req.user._id }).populate('members', 'name email role');
    // (Optional) If you implement managers separately, include those too
    res.json({ teams: owned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list teams' });
  }
};


exports.setActiveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Optionally verify that req.user is allowed to select this team (e.g., admin of it)
    if (String(team.adminId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not allowed to select this team' });
    }

    req.user.teamId = teamId;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set active team' });
  }
};


exports.addUserToTeam = async (req, res) => {
  try {
    const { email, name, userId } = req.body;
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    let user;
    
    if (userId) {
      // Adding existing user by ID
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else if (email) {
      // Check if user exists by email
      user = await User.findOne({ email });
      
      if (!user) {
        // Create new user if they don't exist
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

    // Add user to team members if not already there
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

exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate('members', 'name email role');
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Get admin user as well
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

// Get all users in the database
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('name email role _id teamId');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};


