import { useDraggable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

export const Draggable = ({ id, children, className }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none',
        isDragging ? 'opacity-40' : 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {children}
    </div>
  );
};
