import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // adjust if deployed

export default socket;
