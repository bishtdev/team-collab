import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMoreVertical } from 'react-icons/fi';

export const SortableItem = ({ id, task, statusColor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`mb-3 ${isDragging ? 'z-10' : ''}`}
    >
      <div 
        {...listeners}
        className={`p-4 bg-white dark:bg-gray-700 rounded-lg shadow border-l-4 ${statusColor} dark:border-opacity-50 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200`}
      >
        <div className="flex justify-between">
          <h3 className="font-medium text-gray-800 dark:text-white">
            {task.title}
          </h3>
          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
            <FiMoreVertical />
          </button>
        </div>
        
        {task.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {task.description}
          </p>
        )}
        
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
            {task.priority || 'Normal'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {task.assignee || 'Unassigned'}
          </span>
        </div>
      </div>
    </div>
  );
};