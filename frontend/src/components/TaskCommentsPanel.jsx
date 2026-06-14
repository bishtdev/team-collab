import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchComments, createComment } from '../features/tasks/commentsSlice';
import CommentItem from './CommentItem';

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
    <section aria-label="Task Comments" className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Comments</h3>
        <span className="text-xs text-gray-400">{comments.length} / {pagination.total} total</span>
      </div>

      <form onSubmit={handleAddComment} className="flex items-start gap-2 mb-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 resize-none bg-gray-800/50 text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium disabled:opacity-50"
          disabled={!newComment.trim()}
        >
          Post
        </button>
      </form>

      {displayError && <div className="mb-2 text-xs text-red-400">{displayError}</div>}

      <div className="max-h-64 overflow-auto pr-1 scrollbar-thin">
        {isLoading && comments.length === 0 ? (
          <div className="text-xs text-gray-400">Loading comments...</div>
        ) : (
          comments.map((c) => (
            <CommentItem key={c._id} comment={c} />
          ))
        )}
      </div>

      {canLoadMore && (
        <div className="mt-2 text-right">
          <button
            className="text-xs text-gray-300 hover:text-white"
            onClick={() => fetchPage(page + 1)}
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
};

export default TaskCommentsPanel;
