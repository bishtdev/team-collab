import React, { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiExternalLink, FiTrash2, FiX } from 'react-icons/fi';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAllNotifications, fetchNotifications } = useSocket();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications(1, 20);
    }
  }, [isOpen, fetchNotifications, notifications.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNavigate = (notification) => {
    if (notification.taskId) {
      markAsRead(notification._id);
      if (notification.projectId) {
        navigate(`/project/${notification.projectId}/kanban`);
      }
    }
    onClose();
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FiBell className="text-gray-400 w-4 h-4" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500/10 text-red-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-red-500/20">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 px-1.5 py-1 rounded hover:bg-gray-800"
              title="Mark all as read"
            >
              <FiCheck className="w-3 h-3" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 px-1.5 py-1 rounded hover:bg-red-950/30"
              title="Clear all notifications"
            >
              <FiTrash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600">
            <FiBell className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`group relative border-b border-gray-800/50 ${
                !n.read ? 'bg-gray-800/30' : ''
              }`}
            >
              <button
                onClick={() => handleNavigate(n)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors flex gap-3"
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  n.read ? 'bg-transparent' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-600">{formatTime(n.createdAt)}</span>
                    {n.taskId && (
                      <FiExternalLink className="w-2.5 h-2.5 text-gray-600" />
                    )}
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeNotification(n._id); }}
                className="absolute top-2 right-2 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove notification"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
