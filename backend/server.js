// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes')
const teamRoutes = require('./routes/teamRoutes');
const http = require('http');
const socketIO = require('socket.io');
const Message = require('./models/Message'); 

dotenv.config();

const app = express();

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://team-collab-devbisht.vercel.app', // Replace with your actual frontend URL
  process.env.FRONTEND_URL // Environment variable for frontend URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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

// Firebase Admin Init
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // For production - use environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // For development - use local file
  // serviceAccount = require('./config/firebaseServiceAccount.json');
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

const verifyFirebaseToken = require('./middlewares/verifyFirebaseToken');
const authenticate = require('./middlewares/auth');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Sample Route
app.get('/', (req, res) => {
  res.send('Team Collaboration API Running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', verifyFirebaseToken, authenticate, projectRoutes);
app.use('/api/tasks', verifyFirebaseToken, authenticate, taskRoutes);
app.use('/api/messages', verifyFirebaseToken, authenticate, messageRoutes);
app.use('/api/teams', verifyFirebaseToken, authenticate, teamRoutes);
app.use('/api/users', verifyFirebaseToken, authenticate, teamRoutes);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  socket.on('joinTeamRoom', (teamId) => {
    socket.join(teamId);
    console.log(`User ${socket.id} joined team: ${teamId}`);
  });

  socket.on('sendMessage', async ({ teamId, senderId, content }) => {
    try {
      const message = await Message.create({ 
        teamId, 
        senderId, 
        content
      });
      io.to(teamId).emit('receiveMessage', {
        _id: message._id,
        teamId,
        content: message.content,
        senderId: message.senderId,
        timestamp: message.timestamp,
      });
    } catch (err) {
      console.error('Error creating message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
  });
});