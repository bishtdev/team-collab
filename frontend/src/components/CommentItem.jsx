import React from 'react';
import { UserAvatar } from '@/components/product/UserAvatar';

// CommentItem
// Simple presentational component for a single comment
// Props:
// - comment: object containing at least { content, createdAt, authorId: { name, email } }
const CommentItem = ({ comment }) => {
  const author = comment.authorId || {};
  const name = author.name || 'Unknown';
  const time = new Date(comment.createdAt).toLocaleString();
  return (
    <div className="mb-2 flex items-start gap-3">
      <UserAvatar name={name} size="md" />
      <div className="min-w-0 flex-1 rounded-md border border-border bg-background p-3 text-small">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">{name}</span>
          <span className="text-micro tabular-nums text-faint">{time}</span>
        </div>
        <div className="whitespace-pre-wrap text-foreground">{comment.content}</div>
      </div>
    </div>
  );
};

export default CommentItem;
