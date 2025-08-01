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
const http = require('http');
const socketIO = require('socket.io');
const Message = require('./models/Message'); 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin Init
const serviceAccount = require('./config/firebaseServiceAccount.json');
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
app.use('/api/projects', projectRoutes);

//task route
app.use('/api/tasks', taskRoutes);

// message route
app.use('/api/messages', messageRoutes)




// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const server = http.createServer(app); // Instead of app.listen()
const io = socketIO(server, {
  cors: {
    origin: '*', // Change this to your frontend domain in production
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  // Join team room
  socket.on('joinRoom', ({ teamId }) => {
    socket.join(teamId);
    console.log(`User ${socket.id} joined team: ${teamId}`);
  });

  // Receive and broadcast new message
  socket.on('sendMessage', async ({ teamId, senderId, text }) => {
    const message = await Message.create({ teamId, sender: senderId, text });
    io.to(teamId).emit('newMessage', {
      _id: message._id,
      teamId,
      sender: senderId,
      text,
      sentAt: message.sentAt,
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
  });
});