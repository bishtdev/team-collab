import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { addNotification, fetchUnreadCount } from '../features/notifications/notificationsSlice';
import { toast } from 'sonner';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, refreshUser } = useAuth();
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

      // Notification listener
      s.on('notification', (notification) => {
        dispatch(addNotification(notification));
      });

      // Real-time role sync: refresh user on role changes (Phase 4)
      s.on('user:role-updated', async (data) => {
        if (data.teamId === user.teamId) {
          toast.info(`Your role has been changed to ${data.role}`);
          await refreshUser();
        }
      });

      // Handle being removed from a team
      s.on('user:removed-from-team', async (data) => {
        if (data.teamId === user.teamId) {
          toast.info('You have been removed from this team');
          await refreshUser();
        }
      });

      dispatch(fetchUnreadCount());
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off('notification');
        socketRef.current.off('user:role-updated');
        socketRef.current.off('user:removed-from-team');
        socketRef.current.emit('leaveRoom', user.teamId);
        disconnectSocket();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user, user?._id, user?.teamId, dispatch, refreshUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
