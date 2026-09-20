import { useDroppable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

export const Droppable = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-surface/50 transition-colors duration-150 ease-kiln',
        isOver && 'border-primary/50 ring-1 ring-primary/25',
        className
      )}
    >
      {children}
    </div>
  );
};
