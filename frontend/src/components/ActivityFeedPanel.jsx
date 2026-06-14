import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivities } from '../features/tasks/activitiesSlice';

const ActivityFeedPanel = ({ taskId, initialPage = 1, pageSize = 20 }) => {
  const dispatch = useDispatch();
  const activityState = useSelector(state => state.activities[taskId]);
  const activities = activityState?.items || [];
  const isLoading = activityState?.isLoading || false;
  const pagination = activityState?.pagination || { total: 0 };

  const [page, setPage] = useState(initialPage);

  const fetchPage = useCallback((p) => {
    dispatch(fetchActivities({ taskId, page: p, limit: pageSize }));
    setPage(p);
  }, [taskId, dispatch, pageSize]);

  useEffect(() => {
    if (taskId) fetchPage(1);
  }, [taskId, fetchPage]);

  const canLoadMore = activities.length < pagination.total;

  const formatAction = (action) => {
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

  const formatActor = (activity) => {
    if (activity.actorId && typeof activity.actorId === 'object') {
      return activity.actorId.name || 'Unknown';
    }
    return 'Unknown';
  };

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
        <span className="text-xs text-gray-500">{activities.length} / {pagination.total}</span>
      </div>

      {activityState?.error && <div className="text-xs text-red-400 mb-2">{activityState.error}</div>}

      <div className="max-h-48 overflow-auto pr-1 scrollbar-thin space-y-2">
        {isLoading && activities.length === 0 ? (
          <div className="text-xs text-gray-400">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No activity yet</div>
        ) : (
          activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-2">
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
            onClick={() => fetchPage(page + 1)}
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
};

export default ActivityFeedPanel;
