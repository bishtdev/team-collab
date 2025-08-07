// src/components/Droppable.jsx
import { useDroppable } from '@dnd-kit/core';

export const Droppable = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px]">
      {children}
    </div>
  );
};
