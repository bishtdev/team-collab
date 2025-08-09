import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import api from '../services/api'; // Use your api service instead of axios

const socket = io('http://localhost:5000', {
  withCredentials: true,
  transports:['websocket', 'polling']
});

const ChatPage = ({ teamId, currentUser }) => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    if (!teamId) return;
    
    // Join room
    socket.emit('joinTeamRoom', teamId);

    // Receive real-time messages
    socket.on('receiveMessage', (newMsg) => {
      setChat((prev) => [...prev, newMsg]);
    });

    // Load previous messages
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${teamId}`);
        setChat(res.data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchMessages();

    return () => {
      socket.off('receiveMessage');
      socket.emit('leaveRoom', teamId);
    };
  }, [teamId]);

  const handleSend = () => {
  if (!message.trim() || !currentUser) return;

  socket.emit('sendMessage', {
    content: message, // Match the backend expectation
    senderId: currentUser._id,
    teamId,
  });
  setMessage('');
};

  if (!teamId || !currentUser) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="p-4 bg-black">
  <h2 className="text-xl font-bold text-white mb-4">Team Chat</h2>
  
  {/* Messages container */}
  <div className="h-[400px] overflow-y-auto border border-gray-800 bg-gray-900 rounded-lg mb-4 p-3">
    {chat.map((msg, i) => (
      <div 
        key={i} 
        className={`mb-3 ${
          msg.senderId._id === currentUser._id ? 'text-right' : 'text-left'
        }`}
      >
        <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
          msg.senderId._id === currentUser._id 
            ? 'bg-gray-700' 
            : 'bg-gray-800 border border-gray-700'
        }`}>
          <p className="text-sm font-medium text-blue-400 mb-1">
            {msg.senderId._id === currentUser._id ? 'You' : msg.senderId.name}
          </p>
          <p className="text-gray-200">{msg.content}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    ))}
  </div>

  {/* Message input */}
  <div className="flex gap-2">
    <input
      className="flex-1 p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-gray-600"
      placeholder="Type a message..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
    />
    <button 
      className="px-4 bg-white text-gray-900 hover:bg-gray-200 rounded-lg transition-colors font-medium"
      onClick={handleSend}
    >
      Send
    </button>
  </div>
</div>
  );
};

export default ChatPage;