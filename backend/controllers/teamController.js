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
    const owned = await Team.find({ adminId: req.user._id });
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

