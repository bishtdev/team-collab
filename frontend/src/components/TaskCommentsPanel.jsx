import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageSquare } from 'lucide-react';
import { fetchComments, createComment } from '../features/tasks/commentsSlice';
import CommentItem from './CommentItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/product/EmptyState';

const TaskCommentsPanel = ({ taskId, initialCommentsPage = 1, pageSize = 20, onCommentAdded }) => {
  const dispatch = useDispatch();
  const commentState = useSelector(state => state.comments[taskId]);
  const comments = commentState?.items || [];
  const isLoading = commentState?.isLoading || false;
  const pagination = commentState?.pagination || { total: 0 };

  const [page, setPage] = useState(initialCommentsPage);
  const [newComment, setNewComment] = useState('');
  const [localError, setLocalError] = useState('');

  const fetchPage = useCallback((p) => {
    dispatch(fetchComments({ taskId, page: p, limit: pageSize }));
    setPage(p);
  }, [taskId, dispatch, pageSize]);

  useEffect(() => {
    if (taskId) fetchPage(1);
  }, [taskId, fetchPage]);

  const canLoadMore = comments.length < pagination.total;

  const handleAddComment = async (e) => {
    e.preventDefault();
    const content = newComment?.trim();
    if (!content) return;
    try {
      await dispatch(createComment({ taskId, data: { content } })).unwrap();
      setNewComment('');
      fetchPage(1);
      onCommentAdded?.();
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : 'Failed to add comment');
    }
  };

  const displayError = localError || commentState?.error;

  return (
    <section aria-label="Task Comments" className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-small font-semibold text-foreground">Comments</h3>
        <span className="text-micro tabular-nums text-faint">{comments.length} / {pagination.total} total</span>
      </div>

      <form onSubmit={handleAddComment} className="mb-3 flex flex-col gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim()}
          >
            Post
          </Button>
        </div>
      </form>

      {displayError && <div className="mb-2 text-small text-destructive">{displayError}</div>}

      <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin">
        {isLoading && comments.length === 0 ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-5/6" />
          </div>
        ) : comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description="Start the conversation below."
            className="border-0 bg-transparent px-4 py-6"
          />
        ) : (
          comments.map((c) => (
            <CommentItem key={c._id} comment={c} />
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

export default TaskCommentsPanel;
