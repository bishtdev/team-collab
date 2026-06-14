import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { addNotification, fetchUnreadCount } from '../features/notifications/notificationsSlice';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user.teamId) {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    let cancelled = false;

    const initSocket = async () => {
      const s = await connectSocket();
      if (cancelled || !s) return;

      socketRef.current = s;
      setSocket(s);

      s.emit('joinTeamRoom', user.teamId);

      s.on('notification', (notification) => {
        dispatch(addNotification(notification));
      });

      dispatch(fetchUnreadCount());
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off('notification');
        socketRef.current.emit('leaveRoom', user.teamId);
        disconnectSocket();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user, user?._id, user?.teamId, dispatch]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
