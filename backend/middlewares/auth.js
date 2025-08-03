// middlewares/auth.js
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  // assumes verifyFirebaseToken ran before and set req.firebaseUser
  if (!req.firebaseUser) {
    return res.status(401).json({ error: 'No Firebase user info' });
  }

  const email = req.firebaseUser.email;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'User not found in database' });
  }
  req.user = user;
  next();
};

module.exports = authenticate;
