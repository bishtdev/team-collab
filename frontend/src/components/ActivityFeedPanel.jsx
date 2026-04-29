import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

// ActivityFeedPanel
// Displays a timeline-style feed of task activities (audit log)
// Props:
// - taskId: MongoDB ObjectId of the task
// - initialPage (optional): starting page (default 1)
// - pageSize (optional): items per page (default 20)
// - onActivityLogged (optional): callback after activity recorded
const ActivityFeedPanel = ({ taskId, initialPage = 1, pageSize = 20, onActivityLogged }) => {
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch activities for the given page
  const fetchActivities = useCallback(async (p = 1) => {
    if (!taskId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/tasks/${taskId}/activities?page=${p}&limit=${pageSize}`);
      const { activities: fetched, pagination } = res.data;
      // Page 1 replaces; subsequent pages append
      if (p === 1) {
        setActivities(fetched || []);
      } else {
        setActivities(prev => [...prev, ...(fetched || [])]);
      }
      setTotal(pagination?.total ?? 0);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, pageSize]);

  // Initial load
  useEffect(() => {
    if (taskId) fetchActivities(1);
  }, [taskId]);

  const canLoadMore = activities.length < total;

  // Helper to render activity action string
  const formatAction = (action) => {
    // Map internal action keys to readable strings
    const actionMap = {
      comment_created: 'added a comment',
      task_created: 'created this task',
      task_updated: 'updated the task',
      status_changed: 'changed task status',
      assignee_changed: 'changed assignee',
      priority_changed: 'changed priority',
      due_date_changed: 'changed due date',
    };
    return actionMap[action] || action;
  };

  // Helper to format actor name from populated data
  const formatActor = (activity) => {
    if (activity.actorId && typeof activity.actorId === 'object') {
      return activity.actorId.name || 'Unknown';
    }
    return 'Unknown';
  };

  // Helper to format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <section aria-label="Task Activity Feed" className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Activity</h4>
        <span className="text-xs text-gray-500">{activities.length} / {total}</span>
      </div>

      {error && <div className="text-xs text-red-400 mb-2">{error}</div>}

      <div className="max-h-48 overflow-auto pr-1 scrollbar-thin space-y-2">
        {isLoading && activities.length === 0 ? (
          <div className="text-xs text-gray-400">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No activity yet</div>
        ) : (
          activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-2">
              {/* Timeline dot */}
              <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-300">
                  <span className="font-medium text-white">{formatActor(activity)}</span>{' '}
                  <span className="text-gray-400">{formatAction(activity.action)}</span>
                </div>
                <div className="text-[10px] text-gray-500">{formatTime(activity.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {canLoadMore && (
        <div className="mt-2 text-right">
          <button
            className="text-xs text-gray-400 hover:text-white"
            onClick={() => fetchActivities(page + 1)}
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
};

export default ActivityFeedPanel;