const admin = require('firebase-admin');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded; // contains email, uid, etc.
    console.log('Authorization header received:', req.headers.authorization);

    next();
  } catch (err) {
    console.log('Token verify failed:', err.message);
    return res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

module.exports = verifyFirebaseToken;
