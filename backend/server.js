// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const http = require('http');
const socketIO = require('socket.io');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes');
const teamRoutes = require('./routes/teamRoutes');
const userRoutes = require('./routes/userRoutes'); // New: separated user routes
// Task comments & activities MVP
const commentRoutes = require('./routes/commentRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Model imports
const Message = require('./models/Message');
const User = require('./models/User');

// Middleware imports
const verifyFirebaseToken = require('./middlewares/verifyFirebaseToken');
const authenticate = require('./middlewares/auth');

dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// CORS configuration
// Only allow specific origins to make requests to this server.
// In production, FRONTEND_URL should be set in environment variables.
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://team-collab-devbisht.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined/null entries

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, you may want to reject these for tighter security
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Rate Limiting
// Prevents brute-force attacks and API abuse by limiting requests per IP.
// - General limiter: 100 requests per 15 minutes for all API routes
// - Auth limiter: stricter limit on auth endpoints (login/signup)
// ---------------------------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 200, // max 200 requests per window per IP
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Stricter limit for auth endpoints
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// ---------------------------------------------------------------------------
// Firebase Admin SDK Initialization
// Supports two modes:
// 1. Production: FIREBASE_SERVICE_ACCOUNT env var containing JSON string
// 2. Development: Local JSON file at config/firebaseServiceAccount.json
// ---------------------------------------------------------------------------
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production: parse the JSON string from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Development: load from local file
  serviceAccount = require('./config/firebaseServiceAccount.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ---------------------------------------------------------------------------
// MongoDB Connection
// Connects to MongoDB using the URI from environment variables.
// Uses Mongoose for ODM (Object Document Mapping).
// ---------------------------------------------------------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// ---------------------------------------------------------------------------
// Health Check Endpoint
// Used by load balancers and monitoring tools to verify server status.
// Returns server uptime and database connection state.
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Team Collaboration API Running...');
});

// ---------------------------------------------------------------------------
// API Routes
// Each protected route group goes through two middleware layers:
// 1. verifyFirebaseToken: Validates the Firebase ID token from Authorization header
// 2. authenticate: Looks up the user in our MongoDB by email from the decoded token
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes); // Auth routes handle their own Firebase verification
app.use('/api/projects', verifyFirebaseToken, authenticate, projectRoutes);
app.use('/api/tasks', verifyFirebaseToken, authenticate, taskRoutes);
app.use('/api/tasks', verifyFirebaseToken, authenticate, commentRoutes);
app.use('/api/tasks', verifyFirebaseToken, authenticate, activityRoutes);
app.use('/api/messages', verifyFirebaseToken, authenticate, messageRoutes);
app.use('/api/teams', verifyFirebaseToken, authenticate, teamRoutes);
app.use('/api/users', verifyFirebaseToken, authenticate, userRoutes); // Separated user routes

// ---------------------------------------------------------------------------
// HTTP Server + Socket.io Setup
// Socket.io is used for real-time team chat functionality.
// CORS is configured to match the Express CORS settings.
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// ---------------------------------------------------------------------------
// Socket.io Authentication Middleware
// Every WebSocket connection must provide a valid Firebase ID token.
// The token is sent via socket.handshake.auth.token during connection.
// If the token is invalid, the connection is rejected.
// ---------------------------------------------------------------------------
io.use(async (socket, next) => {
  try {
    // Extract token from the auth object sent during socket connection
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify the Firebase token - this ensures only authenticated users
    // can establish a WebSocket connection
    const decoded = await admin.auth().verifyIdToken(token);

    // Look up the user in our database to get their MongoDB _id and team info
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user info to the socket for use in event handlers
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication failed:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// ---------------------------------------------------------------------------
// Socket.io Event Handlers
// Handles real-time team chat: joining rooms, sending/receiving messages.
// All events are scoped to authenticated users and their teams.
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'userId:', socket.user._id);

  // Join a team chat room
  // Only allow users to join rooms for teams they belong to
  socket.on('joinTeamRoom', (teamId) => {
    // Verify the user belongs to this team before joining
    if (socket.user.teamId && socket.user.teamId.toString() === teamId.toString()) {
      socket.join(teamId);
      console.log(`User ${socket.user.name} joined team room: ${teamId}`);
    } else {
      console.warn(`User ${socket.user._id} attempted to join unauthorized team: ${teamId}`);
    }
  });

  // Send a message to a team chat room
  // The senderId is taken from the authenticated socket.user, NOT from client input
  socket.on('sendMessage', async ({ teamId, content }) => {
    try {
      // Verify user belongs to the team they're sending to
      if (socket.user.teamId && socket.user.teamId.toString() !== teamId.toString()) {
        return socket.emit('error', { message: 'Not authorized to send messages to this team' });
      }

      // Validate message content
      if (!content || !content.trim()) {
        return socket.emit('error', { message: 'Message content cannot be empty' });
      }

      // Create message in database using the authenticated user's ID
      // Important: We use socket.user._id, NOT any client-provided senderId
      const message = await Message.create({
        teamId,
        senderId: socket.user._id, // Use authenticated user's ID
        content: content.trim()
      });

      // Broadcast the message to all users in the team room
      io.to(teamId).emit('receiveMessage', {
        _id: message._id,
        teamId,
        content: message.content,
        senderId: {
          _id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email
        },
        timestamp: message.timestamp,
      });
    } catch (err) {
      console.error('Error creating message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'userId:', socket.user._id);
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
