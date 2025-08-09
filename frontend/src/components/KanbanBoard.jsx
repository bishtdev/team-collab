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
import { FiPlus, FiMoreVertical, FiUser, FiFlag, FiCalendar, FiPaperclip, FiEdit2, FiTrash2 } from 'react-icons/fi';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

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
    const fetchMembers = async () => {
      try {
        // Get team members for the current team
        const res = await api.get('/users/team');
        setTeamMembers(res.data.members || []);
      } catch (err) {
        console.error('Failed to fetch team members', err);
        setTeamMembers([]);
      }
    };

    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await api.get(`/tasks?projectId=${projectId}`);
        setTasks(res.data);
      } catch (err) {
        console.error("Fetch tasks failed", err);
        setTasks([]);
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
    if (!newTaskTitle.trim() || !projectId) return;
    
    try {
      setIsAddingTask(true);
      const res = await api.post('/tasks', {
        title: newTaskTitle,
        status: 'todo',
        projectId,
        assignedTo: newTaskAssignee || null
      });
      
      // Populate the assignedTo field for the new task
      const populatedTask = {
        ...res.data,
        assignedTo: newTaskAssignee ? teamMembers.find(m => m._id === newTaskAssignee) : null
      };
      
      setTasks(prev => [...prev, populatedTask]);
      setNewTaskTitle('');
      setNewTaskAssignee('');
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

  const handleAssignTask = async (taskId, assignedTo) => {
    try {
      await api.put(`/tasks/${taskId}`, { assignedTo });
      setTasks(prev => prev.map(t => 
        t._id === taskId ? { 
          ...t, 
          assignedTo: assignedTo ? teamMembers.find(m => m._id === assignedTo) : null 
        } : t
      ));
    } catch (err) {
      console.error("Failed to assign task", err);
    }
  };

  const getTaskCount = (status) => tasks.filter(task => task.status === status).length;

  return (
    <div className="flex flex-col h-full bg-black">
    {/* Header with add task functionality */}
    <div className="p-4 bg-gray-900 border-b border-gray-800">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-xl font-bold text-white">Project Board</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white"
          >
            <option value="">Assign to...</option>
            {teamMembers.map(member => (
              <option key={member._id} value={member._id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
  
          <button 
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-900 hover:bg-gray-200 rounded-lg border border-gray-700"
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
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:border-gray-600"
            onKeyDown={(e) => e.key === 'Enter' && createTask()}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddingTask(false)}
              className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button 
              onClick={createTask}
              disabled={!newTaskTitle.trim()}
              className={`px-4 py-2 rounded-lg ${
                newTaskTitle.trim() 
                  ? 'bg-white text-gray-900 hover:bg-gray-200' 
                  : 'bg-gray-800 text-gray-500'
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
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          Object.entries(statusConfig).map(([statusId, status]) => (
            <Droppable 
              key={statusId} 
              id={statusId}
              className="min-w-[300px] w-full max-w-xs mr-4 last:mr-0"
            >
              <div className="flex flex-col h-full">
                <div className={`flex items-center justify-between p-3 rounded-t-lg bg-gray-800 border-b border-gray-700`}>
                  <div className="flex items-center">
                    <h2 className="font-semibold text-white">
                      {status.title}
                    </h2>
                    <span className="ml-2 bg-gray-700 text-xs font-medium px-2 py-1 rounded-full text-gray-300">
                      {getTaskCount(statusId)}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    <FiMoreVertical />
                  </button>
                </div>
                
                <SortableContext 
                  items={tasks.filter(t => t.status === statusId).map(t => t._id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 overflow-y-auto p-2 bg-gray-900 rounded-b-lg min-h-[400px]">
                    {tasks
                      .filter(task => task.status === statusId)
                      .map(task => (
                        <Draggable key={task._id} id={task._id}>
                          <div className="mb-3 p-4 bg-gray-800 rounded-lg border border-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-white">
                                {editingTask?._id === task._id ? (
                                    <input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateTaskTitle(task._id);
                                      }}
                                      className="bg-gray-700 border-b border-gray-600 focus:outline-none text-white"
                                    />
                                  ) : (
                                    task.title
                                  )}
                              </h3>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditTask(task)} className="text-gray-400 hover:text-white">
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteTask(task._id)} className="text-gray-400 hover:text-red-400">
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
  
                            {task.description && (
                              <p className="mt-2 text-sm text-gray-400">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-gray-300">
                                <FiFlag className="text-red-400" /> High
                              </span>
                              
                              {/* Assignee dropdown */}
                              <select
                                value={task.assignedTo?._id || ''}
                                onChange={(e) => handleAssignTask(task._id, e.target.value || null)}
                                className="px-2 py-1 bg-gray-700 rounded text-xs border-none text-gray-300 focus:ring-1 focus:ring-gray-600"
                              >
                                <option value="">Unassigned</option>
                                {teamMembers.map(member => (
                                  <option key={member._id} value={member._id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
  
                              {task.assignedTo && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-gray-300">
                                  <FiUser className="text-blue-400" />
                                  {task.assignedTo.name}
                                </span>
                              )}
  
                              <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-gray-300">
                                <FiPaperclip /> 2
                              </span>
                              <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-gray-300">
                                <FiCalendar /> Aug 10
                              </span>
                            </div>
                          </div>
                        </Draggable>
                      ))
                    }
                    
                    {tasks.filter(task => task.status === statusId).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-gray-600">
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
          <div className="p-4 bg-gray-800 rounded-lg border-2 border-gray-600 w-72 shadow-xl">
            <div className="font-medium text-white mb-2">
              {activeTask.title}
            </div>
            <div className="text-sm text-gray-400">
              {activeTask.description || 'No description'}
            </div>
            {activeTask.assignedTo && (
              <div className="text-sm text-blue-400 mt-1">
                Assigned to: {activeTask.assignedTo.name}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  </div>
  );
};

export default KanbanBoard;