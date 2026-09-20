import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Activity } from 'lucide-react';
import { fetchActivities } from '../features/tasks/activitiesSlice';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/product/EmptyState';

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
    <section aria-label="Task Activity Feed" className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-small font-semibold text-foreground">Activity</h4>
        <span className="text-micro tabular-nums text-faint">{activities.length} / {pagination.total}</span>
      </div>

      {activityState?.error && <div className="mb-2 text-small text-destructive">{activityState.error}</div>}

      <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1 scrollbar-thin">
        {isLoading && activities.length === 0 ? (
          <div className="space-y-3 py-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Changes to this task will appear here."
            className="border-0 bg-transparent px-4 py-6"
          />
        ) : (
          activities.map((activity) => (
            <div key={activity._id} className="group flex items-start gap-2.5">
              <div className="relative mt-1.5 flex-shrink-0">
                <div className="size-2 rounded-full bg-faint transition-colors group-hover:bg-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-small leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{formatActor(activity)}</span>{' '}
                  <span>{formatAction(activity.action)}</span>
                </div>
                <div className="mt-0.5 text-micro tabular-nums text-faint">{formatTime(activity.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {canLoadMore && (
        <div className="mt-3 border-t border-border pt-2 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fetchPage(page + 1)}
          >
            Load more
          </Button>
        </div>
      )}
    </section>
  );
};

export default ActivityFeedPanel;
