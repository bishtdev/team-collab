import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import CommentItem from './CommentItem';

// TaskCommentsPanel
// Props:
// - taskId: MongoDB ObjectId of the task to show comments for
// - initialCommentsPage (optional): starting page for comments (default 1)
// - pageSize (optional): number of comments per page (default 20)
// - onCommentAdded (optional): callback triggered after a successful comment add
const TaskCommentsPanel = ({ taskId, initialCommentsPage = 1, pageSize = 20, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(initialCommentsPage);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  // Fetch comments for the given page
  const fetchComments = useCallback(async (p = 1) => {
    if (!taskId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/tasks/${taskId}/comments?page=${p}&limit=${pageSize}`);
      const { comments: fetched, pagination } = res.data;
      // When loading page 1 we replace; otherwise we append older comments to end
      if (p === 1) {
        setComments(fetched || []);
      } else {
        setComments(prev => [...prev, ...(fetched || [])]);
      }
      setTotal(pagination?.total ?? 0);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed toload comments');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, pageSize]);

  // Initial load
  useEffect(() => {
    if (taskId) fetchComments(1);
  }, [taskId]);

  const canLoadMore = comments.length < total;

  const handleAddComment = async (e) => {
    e.preventDefault();
    const content = newComment?.trim();
    if (!content) return;
    try {
      // Create comment via API
      await api.post(`/tasks/${taskId}/comments`, { content });
      // Refresh to include the new comment at top
      setNewComment('');
      fetchComments(1);
      onCommentAdded?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
    }
  };

  return (
    <section aria-label="Task Comments" className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Comments</h3>
        <span className="text-xs text-gray-400">{comments.length} / {total} total</span>
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

      {error && <div className="mb-2 text-xs text-red-400">{error}</div>}

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
            onClick={() => fetchComments(page + 1)}
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
};

export default TaskCommentsPanel;
