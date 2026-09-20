import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, Trash2, X } from 'lucide-react';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '../features/notifications/notificationsSlice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/product/EmptyState';
import { cn } from '@/lib/utils';

const NotificationPanel = ({ isOpen, onClose, position = 'down-right', ignoreRef }) => {
  const dispatch = useDispatch();
  const { items: notifications, unreadCount } = useSelector(state => state.notifications);
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  }, [isOpen, dispatch, notifications.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const insidePanel = panelRef.current && panelRef.current.contains(e.target);
      const insideAnchor = ignoreRef?.current && ignoreRef.current.contains(e.target);
      if (!insidePanel && !insideAnchor) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, ignoreRef]);

  const handleNavigate = (notification) => {
    if (notification.taskId) {
      dispatch(markAsRead(notification._id));
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
      className={cn(
        'absolute z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-pop',
        position === 'up-right' ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2'
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <span className="text-small font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-micro font-medium tabular-nums text-primary">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => dispatch(markAllAsRead())}
              title="Mark all as read"
              aria-label="Mark all as read"
            >
              <CheckCheck className="size-4" strokeWidth={1.75} />
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => dispatch(clearAllNotifications())}
              className="hover:bg-destructive/10 hover:text-destructive"
              title="Clear all notifications"
              aria-label="Clear all notifications"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Updates about your tasks will land here."
            className="rounded-none border-0 bg-transparent px-6 py-10"
          />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`group relative ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => handleNavigate(n)}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    n.read ? 'bg-transparent' : 'bg-primary'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-small text-muted-foreground">{n.message}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-micro tabular-nums text-faint">{formatTime(n.createdAt)}</span>
                      {n.taskId && (
                        <ExternalLink className="size-3.5 text-faint" strokeWidth={1.75} />
                      )}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(n._id)); }}
                  className="absolute top-2 right-2 rounded-xs p-1 text-faint opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  title="Remove notification"
                  aria-label="Remove notification"
                >
                  <X className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
