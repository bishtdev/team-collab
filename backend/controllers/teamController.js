const Team = require('../models/Team');
const User = require('../models/User');

// Create a team and make current user admin
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingTeam = await Team.findOne({ name, adminId: req.user._id });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team with this name already exists for you' });
    }

    const team = await Team.create({
      name,
      description,
      adminId: req.user._id,
    });

    // Update user to belong to this team and role to ADMIN if not already
    req.user.teamId = team._id;
    req.user.role = 'ADMIN';
    await req.user.save();

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
