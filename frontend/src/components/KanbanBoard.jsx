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
import AddTaskModal from './modals/AddTaskModal';
import { usePermissions } from '../hooks/usePermissions';
import { FiPlus, FiMoreVertical, FiUser, FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();

  const statusConfig = useMemo(() => ({
    todo: { title: 'To Do', dotColor: 'bg-gray-400' },
    'in-progress': { title: 'In Progress', dotColor: 'bg-blue-400' },
    done: { title: 'Done', dotColor: 'bg-emerald-400' }
  }), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/users/team');
        setTeamMembers(res.data.members || []);
      } catch (err) {
        setTeamMembers([]);
      }
    };
    if (projectId) fetchMembers();
  }, [projectId]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await api.get(`/tasks?projectId=${projectId}`);
        setTasks(res.data);
      } catch (err) {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  const handleDragStart = (event) => {
    setActiveTask(tasks.find(task => task._id === event.active.id));
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
      setTasks(prev => prev.map(t =>
        t._id === draggedTask._id ? { ...t, status: newStatus } : t
      ));
      await api.put(`/tasks/${draggedTask._id}`, { status: newStatus });
    } catch (err) {
      setTasks(prev => prev.map(t =>
        t._id === draggedTask._id ? { ...t, status: draggedTask.status } : t
      ));
    } finally {
      setActiveTask(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
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
      console.error('Failed to update task', err);
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
      console.error('Failed to assign task', err);
    }
  };

  const getTaskCount = (status) => tasks.filter(task => task.status === status).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-lg font-semibold text-white">Board</h1>
        {canCreateTask && (
          <button
            id="add-task-btn"
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all text-sm shadow-lg shadow-white/5"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-5">
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            Object.entries(statusConfig).map(([statusId, status]) => (
              <Droppable
                key={statusId}
                id={statusId}
                className="min-w-[300px] w-full max-w-xs"
              >
                <div className="flex flex-col h-full">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-3 rounded-t-xl bg-gray-900/80 border border-gray-800/50 border-b-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                        {status.title}
                      </h2>
                      <span className="bg-gray-800 text-xs font-medium px-2 py-0.5 rounded-full text-gray-500">
                        {getTaskCount(statusId)}
                      </span>
                    </div>
                  </div>

                  <SortableContext
                    items={tasks.filter(t => t.status === statusId).map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 overflow-y-auto p-2 bg-gray-900/40 rounded-b-xl border border-gray-800/50 border-t-0 min-h-[350px] space-y-2 scrollbar-thin">
                      {tasks
                        .filter(task => task.status === statusId)
                        .map(task => (
                          <Draggable key={task._id} id={task._id}>
                            <div className="p-3.5 bg-gray-800/60 rounded-xl border border-gray-800/40 cursor-grab active:cursor-grabbing hover:border-gray-700/60 transition-all group">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  {editingTask?._id === task._id ? (
                                    <input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateTaskTitle(task._id);
                                        if (e.key === 'Escape') setEditingTask(null);
                                      }}
                                      onBlur={() => updateTaskTitle(task._id)}
                                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-500"
                                      autoFocus
                                    />
                                  ) : (
                                    <h3 className="font-medium text-sm text-white truncate">
                                      {task.title}
                                    </h3>
                                  )}
                                  {task.dueDate && (
                                    <div className="mt-2">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-sm border ${task.dueDate < new Date().toISOString().split('T')[0]
                                          ? 'bg-red-50 text-red-900 border-red-900 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                                          : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
                                          }`}
                                      >
                                        <FiCalendar className="w-3 h-3 mr-2" />
                                        {formatDate(task.dueDate)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                  {canEditTask && (
                                    <button onClick={() => handleEditTask(task)} className="p-1 text-gray-500 hover:text-white rounded transition-colors">
                                      <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {canDeleteTask && (
                                    <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors">
                                      <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {task.description && (
                                <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{task.description}</p>
                              )}

                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {/* Assignee */}
                                  {canEditTask ? (
                                    <select
                                      value={task.assignedTo?._id || ''}
                                      onChange={(e) => handleAssignTask(task._id, e.target.value || null)}
                                      className="text-xs bg-gray-700/40 border border-gray-700/40 rounded-sm px-2 py-1 text-gray-400 focus:outline-none focus:border-gray-600 appearance-none max-w-[120px]"
                                    >
                                      <option value="">Unassigned</option>
                                      {teamMembers.map(member => (
                                        <option key={member._id} value={member._id}>
                                          {member.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : task.assignedTo ? (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <FiUser className="w-3 h-3" />
                                      {task.assignedTo.name}
                                    </span>
                                  ) : null}
                                </div>

                                {/* Date */}
                                {task.createdAt && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-600">
                                    <FiCalendar className="w-3 h-3" />
                                    {formatDate(task.createdAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Draggable>
                        ))
                      }

                      {tasks.filter(task => task.status === statusId).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-gray-700">
                          <p className="text-sm">No tasks</p>
                          <p className="text-xs mt-0.5">Drag tasks here</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </Droppable>
            ))
          )}
        </div>

        <DragOverlay dropAnimation={defaultDropAnimation}>
          {activeTask ? (
            <div className="p-3.5 bg-gray-800 rounded-xl border-2 border-gray-600 w-72 shadow-2xl">
              <div className="font-medium text-sm text-white mb-1">{activeTask.title}</div>
              {activeTask.description && (
                <div className="text-xs text-gray-400">{activeTask.description}</div>
              )}
              {activeTask.assignedTo && (
                <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                  <FiUser className="w-3 h-3" />
                  {activeTask.assignedTo.name}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        projectId={projectId}
        teamMembers={teamMembers}
        onSuccess={(newTask) => setTasks(prev => [...prev, newTask])}
      />
    </div>
  );
};

export default KanbanBoard;