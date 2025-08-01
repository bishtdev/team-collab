import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Chat = ({ teamId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!teamId) return;
    socket.emit('joinRoom', { teamId });

    socket.on('newMessage', (msg) => {
      setMessages((m) => [...m, msg]);
    });

    // Load history
    const load = async () => {
      try {
        const res = await api.get(`/messages/${teamId}`);
        setMessages(res.data.map((m) => ({
          _id: m._id,
          text: m.text || m.content,
          senderId: m.sender?._id || m.senderId,
          sentAt: m.sentAt || m.sentAt,
          sender: m.sender,
        })));
      } catch (err) {
        console.error(err);
      }
    };
    load();

    return () => {
      socket.off('newMessage');
    };
  }, [teamId]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('sendMessage', {
      teamId,
      senderId: user._id,
      text,
    });
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-2 mb-2">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`p-2 rounded ${
              m.sender?._id === user._id ? 'bg-blue-100 self-end' : 'bg-gray-200'
            }`}
          >
            <div className="text-xs text-gray-600">
              {m.sender?.name || 'Unknown'} • {new Date(m.sentAt).toLocaleTimeString()}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type a message"
        />
        <button onClick={send} className="px-4 py-2 bg-green-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
