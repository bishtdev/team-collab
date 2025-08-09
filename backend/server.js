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
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders:['Content-Type', 'Authorization']
}));
app.use(express.json());

// Firebase Admin Init
const serviceAccount = require('./config/firebaseServiceAccount.json');
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

//auth route
app.use('/api/auth', authRoutes);

//project route
app.use('/api/projects', verifyFirebaseToken, authenticate, projectRoutes);

//task route
app.use('/api/tasks',verifyFirebaseToken, authenticate, taskRoutes);

// message route
app.use('/api/messages',verifyFirebaseToken, authenticate, messageRoutes)

//team route
app.use('/api/teams',verifyFirebaseToken, authenticate, teamRoutes);

app.use('/api/users', verifyFirebaseToken, authenticate, teamRoutes);




const PORT = process.env.PORT || 5000;

const server = http.createServer(app); // Create server
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:5173', // Match frontend URL exactly
    methods: ['GET', 'POST'],
    credentials: true // Add this
  },
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  // Join team room
  socket.on('joinTeamRoom', (teamId) => { // Match the frontend event name
  socket.join(teamId);
  console.log(`User ${socket.id} joined team: ${teamId}`);
});

  // Receive and broadcast new message
  socket.on('sendMessage', async ({ teamId, senderId, content }) => {
    try {
      const message = await Message.create({ 
        teamId, 
        senderId, 
        content // Match the Message model schema
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