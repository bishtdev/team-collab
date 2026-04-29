import React from 'react';

// CommentItem
// Simple presentational component for a single comment
// Props:
// - comment: object containing at least { content, createdAt, authorId: { name, email } }
const CommentItem = ({ comment }) => {
  const author = comment.authorId || {};
  const name = author.name || 'Unknown';
  const time = new Date(comment.createdAt).toLocaleString();
  return (
    <div className="flex items-start gap-2 mb-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 bg-gray-800/40 rounded-lg p-2 text-sm border border-gray-700/40">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-medium text-white">{name}</span>
          <span className="text-xs text-gray-400">{time}</span>
        </div>
        <div className="text-white whitespace-pre-wrap">{comment.content}</div>
      </div>
    </div>
  );
};

export default CommentItem;
