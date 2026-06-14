/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch {
      // Silently ignore - count stays at 0
    }
  }, []);

  useEffect(() => {
    if (!user || !user.teamId) {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
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
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      fetchUnreadCount();
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
  }, [user, user?._id, user?.teamId, fetchUnreadCount]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n =>
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently ignore
    }
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const removed = prev.find(n => n._id === id);
        if (removed && !removed.read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n._id !== id);
      });
    } catch {
      // Silently ignore
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Silently ignore
    }
  }, []);

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      const res = await api.get(`/notifications?page=${page}&limit=${limit}`);
      if (page === 1) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...res.data.notifications]);
      }
      setUnreadCount(res.data.unreadCount);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      fetchNotifications,
      fetchUnreadCount
    }}>
      {children}
    </SocketContext.Provider>
  );
};
