// services/socket.js
// Socket.io client configuration for real-time chat.
//
// IMPORTANT: The socket does NOT connect immediately on import.
// Instead, it provides a lazy-connect pattern where components
// call connectSocket() when they need real-time functionality.
// This prevents unnecessary connections on login/signup pages.
//
// Authentication: When connecting, we send the Firebase ID token
// via the auth object. The server validates this token before
// allowing the connection. Without a valid token, the server
// will reject the connection.
import { io } from 'socket.io-client';
import { auth } from '../firebaseConfig';

// Determine server URL based on environment
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://team-collab-backend-lcge.onrender.com'
  : 'http://localhost:5000';

// Create socket instance with autoConnect: false
// The socket won't connect until we explicitly call connectSocket()
let socket = null;

// Get or create the socket instance with authentication
// This function handles getting the Firebase token and passing
// it to the server during the WebSocket handshake
export const connectSocket = async () => {
  // If socket already exists and is connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // Get the current Firebase user's ID token for authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('No Firebase user - cannot connect socket');
    return null;
  }

  const token = await currentUser.getIdToken();

  // Create socket with auth token
  // The server will verify this token before allowing the connection
  socket = io(SOCKET_URL, {
    auth: { token }, // Send token during handshake for server-side verification
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true, // Connect immediately after creation
  });

  return socket;
};

// Disconnect and clean up the socket
// Should be called when the user logs out or navigates away from chat
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get the current socket instance (may be null if not connected)
export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
