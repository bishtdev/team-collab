import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTasks, updateTask, deleteTask, optimisticUpdateStatus, revertTaskStatus } from '../features/tasks/tasksSlice';
import { fetchTeamUsers } from '../features/projects/projectsSlice';
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
import TaskCommentsPanel from './TaskCommentsPanel';
import ActivityFeedPanel from './ActivityFeedPanel';
import SubtasksPanel from './SubtasksPanel';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';
import { FiPlus, FiUser, FiCalendar, FiEdit2, FiTrash2, FiMessageSquare, FiActivity, FiCheckSquare } from 'react-icons/fi';

const KanbanBoard = ({ projectId }) => {
  const dispatch = useDispatch();
  const { items: tasks, isLoading } = useSelector(state => state.tasks);
  const { teamMembers } = useSelector(state => state.projects);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [openCommentsTaskId, setOpenCommentsTaskId] = useState(null);
  const [openActivityTaskId, setOpenActivityTaskId] = useState(null);
  const [openSubtasksTaskId, setOpenSubtasksTaskId] = useState(null);
  const [subtaskSummaries, setSubtaskSummaries] = useState({});

  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const { user } = useAuth();
  const { socket } = useSocket();

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
    if (projectId) {
      dispatch(fetchTasks(projectId));
      dispatch(fetchTeamUsers());
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (!socket || !projectId) return;

    const handleTaskCreated = ({ projectId: pid }) => {
      if (pid === projectId) dispatch(fetchTasks(projectId));
    };

    const handleTaskUpdated = ({ projectId: pid }) => {
      if (pid === projectId) dispatch(fetchTasks(projectId));
    };

    const handleTaskDeleted = ({ taskId, projectId: pid }) => {
      if (pid === projectId) {
        dispatch({ type: 'tasks/delete/fulfilled', payload: taskId });
      }
    };

    const handleCommentAdded = ({ taskId, projectId: pid, actorName }) => {
      if (pid === projectId && actorName !== user?.name) {
        const task = tasks.find(t => t._id === taskId);
        if (task) {
          toast.info(`${actorName} commented on "${task.title}"`);
        }
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('comment:added', handleCommentAdded);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('comment:added', handleCommentAdded);
    };
  }, [socket, projectId, user?.name, dispatch, tasks]);

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

    const originalStatus = draggedTask.status;
    dispatch(optimisticUpdateStatus({ taskId: draggedTask._id, newStatus }));

    try {
      await dispatch(updateTask({ id: draggedTask._id, data: { status: newStatus } })).unwrap();
    } catch {
      dispatch(revertTaskStatus({ taskId: draggedTask._id, originalStatus }));
    } finally {
      setActiveTask(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    dispatch(deleteTask(taskId));
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
  };

  const updateTaskTitle = async (taskId) => {
    try {
      await dispatch(updateTask({ id: taskId, data: { title: editTitle } })).unwrap();
      setEditingTask(null);
      setEditTitle('');
    } catch {
      // error in slice
    }
  };

  const handleAssignTask = async (taskId, assignedTo) => {
    dispatch(updateTask({
      id: taskId,
      data: { assignedTo: assignedTo || null }
    }));
  };

  const getTaskCount = (status) => tasks.filter(task => task.status === status).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleComments = (taskId) => {
    setOpenCommentsTaskId(prev => prev === taskId ? null : taskId);
  };

  const toggleActivity = (taskId) => {
    setOpenActivityTaskId(prev => prev === taskId ? null : taskId);
  };

  const toggleSubtasks = (taskId) => {
    setOpenSubtasksTaskId(prev => prev === taskId ? null : taskId);
  };

  const handleSubtaskSummary = (taskId, total, completed) => {
    setSubtaskSummaries(prev => ({ ...prev, [taskId]: { total, completed } }));
  };

  const handleTaskCreated = (newTask) => {
    const populatedTask = {
      ...newTask,
      assignedTo: newTask.assignedTo ? teamMembers.find(m => m._id === newTask.assignedTo) : null,
    };
    dispatch({ type: 'tasks/create/fulfilled', payload: populatedTask });
  };

  return (
    <div className="flex flex-col h-full">
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
                    <div className="flex-1 overflow-y-auto p-2 min-h-[350px] space-y-2">
                      {tasks
                        .filter(task => task.status === statusId)
                        .map(task => (
                          <Draggable key={task._id} id={task._id}>
                            <div className="group p-3 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors cursor-grab active:cursor-grabbing">

                              <div className="flex items-start gap-2">
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
                                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
                                      autoFocus
                                    />
                                  ) : (
                                    <h3 className="text-sm font-medium text-white leading-snug">
                                      {task.title}
                                    </h3>
                                  )}
                                </div>

                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {canEditTask && (
                                    <button
                                      onClick={() => handleEditTask(task)}
                                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                    >
                                      <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {canDeleteTask && (
                                    <button
                                      onClick={() => handleDeleteTask(task._id)}
                                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-950 transition-colors"
                                    >
                                      <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {task.description && (
                                <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {subtaskSummaries[task._id] && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                  <FiCheckSquare className="w-3 h-3" />
                                  <span>{subtaskSummaries[task._id].completed}/{subtaskSummaries[task._id].total} subtasks</span>
                                </div>
                              )}

                              {task.dueDate && (
                                <div className="mt-2">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border ${task.dueDate < new Date().toISOString().split('T')[0]
                                      ? ' text-red-700 bg-red-950 dark:text-red-400 border-red-900'
                                      : ' bg-gray-900 text-gray-400 border-gray-700'
                                    }`}>
                                    <FiCalendar className="w-3 h-3 shrink-0" />
                                    {formatDate(task.dueDate)}
                                  </span>
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                                {canEditTask ? (
                                  <select
                                    value={task.assignedTo?._id || ''}
                                    onChange={(e) => handleAssignTask(task._id, e.target.value || null)}
                                    className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-400 focus:outline-none focus:border-gray-400 appearance-none max-w-[140px]"
                                  >
                                    <option value="">Unassigned</option>
                                    {teamMembers.map(member => (
                                      <option key={member._id} value={member._id}>{member.name}</option>
                                    ))}
                                  </select>
                                ) : task.assignedTo ? (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <FiUser className="w-3 h-3 shrink-0" />
                                    {task.assignedTo.name}
                                  </span>
                                ) : <div />}

                                {task.createdAt && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-600 shrink-0">
                                    <FiCalendar className="w-3 h-3" />
                                    {formatDate(task.createdAt)}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 pt-2 border-t border-gray-700 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleComments(task._id)}
                                  className="text-xs text-gray-400 hover:text-gray-200 bg-transparent border border-gray-700 hover:border-gray-500 rounded-md px-2 py-1 transition-colors flex items-center gap-1"
                                >
                                  <FiMessageSquare className="w-3 h-3" />
                                  {openCommentsTaskId === task._id ? 'Hide' : 'Comments'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleActivity(task._id)}
                                  className="text-xs text-gray-400 hover:text-gray-200 bg-transparent border border-gray-700 hover:border-gray-500 rounded-md px-2 py-1 transition-colors flex items-center gap-1"
                                >
                                  <FiActivity className="w-3 h-3" />
                                  {openActivityTaskId === task._id ? 'Hide' : 'Activity'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSubtasks(task._id)}
                                  className="text-xs text-gray-400 hover:text-gray-200 bg-transparent border border-gray-700 hover:border-gray-500 rounded-md px-2 py-1 transition-colors flex items-center gap-1"
                                >
                                  <FiCheckSquare className="w-3 h-3" />
                                  {openSubtasksTaskId === task._id ? 'Hide' : `Subtasks${subtaskSummaries[task._id] ? ` (${subtaskSummaries[task._id].completed}/${subtaskSummaries[task._id].total})` : ''}`}
                                </button>
                              </div>

                              {openCommentsTaskId === task._id && (
                                <div className="mt-2">
                                  <TaskCommentsPanel taskId={task._id} />
                                </div>
                              )}

                              {openActivityTaskId === task._id && (
                                <div className="mt-2">
                                  <ActivityFeedPanel taskId={task._id} />
                                </div>
                              )}

                              {openSubtasksTaskId === task._id && (
                                <div className="mt-2">
                                  <SubtasksPanel
                                    taskId={task._id}
                                    onSummaryChange={(total, completed) => handleSubtaskSummary(task._id, total, completed)}
                                  />
                                </div>
                              )}
                            </div>
                          </Draggable>
                        ))
                      }

                      {tasks.filter(task => task.status === statusId).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-gray-600">
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

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        projectId={projectId}
        teamMembers={teamMembers}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
};

export default KanbanBoard;
