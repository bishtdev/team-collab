// import { io } from 'socket.io-client';

// const socket = io(process.env.NODE_ENV === 'production' 
//   ? 'https://team-collab-backend-lcge.onrender.com'  // Replace with your actual backend URL
//   : 'http://localhost:5000', 
//   {
//     withCredentials: true,
//     transports: ['websocket', 'polling']
//   }
// );

// export default socket;


import { io } from 'socket.io-client';

const socket = io('https://team-collab-backend-lcge.onrender.com', 
  {
    withCredentials: true,
    transports: ['websocket', 'polling']
  }
);

export default socket;