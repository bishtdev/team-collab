// src/components/KanbanBoard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimation
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Droppable } from './Droppable';
import { Draggable } from './Draggable';
import { FiPlus, FiMoreVertical, FiUser, FiFlag, FiCalendar, FiPaperclip } from 'react-icons/fi';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  
  const statusConfig = useMemo(() => ({
    todo: { title: 'TO DO', color: 'bg-gray-200', text: 'text-gray-700' },
    'in-progress': { title: 'IN PROGRESS', color: 'bg-blue-200', text: 'text-blue-700' },
    done: { title: 'DONE', color: 'bg-green-200', text: 'text-green-700' }
  }), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      }
    })
  );

  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/tasks?projectId=${projectId}`);
        setTasks(res.data);
      } catch (err) {
        console.error("Fetch tasks failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [projectId]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(tasks.find(task => task._id === active.id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveTask(null);
      return;
    }

    const draggedTask = tasks.find(t => t._id === active.id);
    const newStatus = over.id;

    if (draggedTask.status === newStatus) return;

    try {
      // Optimistic update
      setTasks(prev =>
        prev.map(t =>
          t._id === draggedTask._id ? { ...t, status: newStatus } : t
        )
      );
      
      await api.put(`/tasks/${draggedTask._id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert on error
      setTasks(prev => prev.map(t => 
        t._id === draggedTask._id ? { ...t, status: draggedTask.status } : t
      ));
    } finally {
      setActiveTask(null);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      setIsAddingTask(true);
      const res = await api.post('/tasks', {
        title: newTaskTitle,
        status: 'todo',
        projectId,
      });
      setTasks(prev => [...prev, res.data]);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Task creation failed', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
  if (!window.confirm('Are you sure you want to delete this task?')) return;

  try {
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(task => task._id !== taskId));
  } catch (err) {
    console.error("Failed to delete task", err);
  }
};
const handleEditTask = (task) => {
  setEditingTask(task);
  setEditTitle(task.title);
};

const updateTaskTitle = async (taskId) => {
  try {
    await api.put(`/tasks/${taskId}`, { title: editTitle });
    setTasks(prev => prev.map(t => 
      t._id === taskId ? { ...t, title: editTitle } : t
    ));
    setEditingTask(null);
    setEditTitle('');
  } catch (err) {
    console.error("Failed to update task", err);
  }
};




  const getTaskCount = (status) => tasks.filter(task => task.status === status).length;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header with add task functionality */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Project Board</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
        
        {isAddingTask && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && createTask()}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={createTask}
                disabled={!newTaskTitle.trim()}
                className={`px-4 py-2 rounded-lg ${
                  newTaskTitle.trim() 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Board Columns */}
        <div className="flex flex-1 gap-3 overflow-x-auto p-4">
          {isLoading ? (
            <div className="flex-1 flex  justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            Object.entries(statusConfig).map(([statusId, status]) => (
              <Droppable 
                key={statusId} 
                id={statusId}
                className="min-w-[300px] w-full max-w-xs mr-4 last:mr-0"
              >
                <div className="flex flex-col h-full">
                  <div className={`flex items-center justify-between p-3 rounded-t-lg ${status.color} dark:bg-opacity-20`}>
                    <div className="flex items-center">
                      <h2 className={`font-semibold ${status.text} dark:text-white`}>
                        {status.title}
                      </h2>
                      <span className="ml-2 bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-50 text-xs font-medium px-2 py-1 rounded-full">
                        {getTaskCount(statusId)}
                      </span>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <FiMoreVertical />
                    </button>
                  </div>
                  
                  <SortableContext 
                    items={tasks.filter(t => t.status === statusId).map(t => t._id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-800 rounded-b-lg min-h-[400px]">
                      {tasks
                        .filter(task => task.status === statusId)
                        .map(task => (
                          <Draggable key={task._id} id={task._id}>
                            <div className="mb-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow border-l-4 border-blue-500 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200">
                              <div className="flex justify-between">
                                <h3 className="font-medium text-gray-800 dark:text-white">
                                  {editingTask?._id === task._id ? (
                                      <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') updateTaskTitle(task._id);
                                        }}
                                        className="bg-transparent border-b border-gray-400 dark:border-gray-600 focus:outline-none text-white"
                                      />
                                    ) : (
                                      task.title
                                    )}
                                </h3>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditTask(task)} className="text-blue-500 hover:text-blue-700">
                                    ✏️
                                  </button>
                                  <button onClick={() => handleDeleteTask(task._id)} className="text-red-500 hover:text-red-700">
                                    🗑️
                                  </button>
                                </div>
                              </div>

                              
                              {task.description && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                                  <FiFlag className="text-red-500" /> High
                                </span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                                  <FiUser className="text-blue-500" /> You
                                </span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                                  <FiPaperclip /> 2
                                </span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                                  <FiCalendar /> Aug 10
                                </span>
                              </div>
                            </div>
                          </Draggable>
                        ))
                      }
                      
                      {tasks.filter(task => task.status === statusId).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-gray-500 dark:text-gray-400">
                          <div className="text-5xl mb-2">📋</div>
                          <p>No tasks here</p>
                          <p className="text-sm mt-1 text-center">Drag tasks here or create new ones</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </Droppable>
            ))
          )}
        </div>
        
        {/* Drag Preview */}
        <DragOverlay dropAnimation={defaultDropAnimation}>
          {activeTask ? (
            <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-xl border-2 border-blue-500 w-72">
              <div className="font-medium text-gray-800 dark:text-white mb-2">
                {activeTask.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-300">
                {activeTask.description || 'No description'}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;