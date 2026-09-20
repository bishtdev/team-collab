import React, { useEffect, useState } from 'react';
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
import TaskDetailModal from './modals/TaskDetailModal';
import TaskCommentsPanel from './TaskCommentsPanel';
import ActivityFeedPanel from './ActivityFeedPanel';
import SubtasksPanel from './SubtasksPanel';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';
import {
  Activity,
  CalendarDays,
  Check,
  Eye,
  Image as ImageIcon,
  ListChecks,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/product/StatusBadge';
import { UserAvatar } from '@/components/product/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const statusConfig = {
  todo: { title: 'To do' },
  'in-progress': { title: 'In progress' },
  done: { title: 'Done' },
};

const PRIORITY_BADGE = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'teal' },
  high: { label: 'High', variant: 'gilt' },
  urgent: { label: 'Urgent', variant: 'rust' },
};

function AssigneeMenu({ task, members, onAssign }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xs px-1 py-0.5 text-micro text-muted-foreground transition-colors duration-150 ease-kiln hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Change assignee"
        >
          {task.assignedTo ? (
            <UserAvatar name={task.assignedTo.name} size="xs" />
          ) : (
            <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-faint text-faint">
              <UserRound className="size-3" strokeWidth={1.75} />
            </span>
          )}
          <span>{task.assignedTo?.name || 'Unassigned'}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onAssign(task._id, null)}>
          <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-faint text-faint">
            <UserRound className="size-3" strokeWidth={1.75} />
          </span>
          Unassigned
          {!task.assignedTo && <Check className="ml-auto size-4" strokeWidth={1.75} />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {members.map((member) => (
          <DropdownMenuItem key={member._id} onSelect={() => onAssign(task._id, member._id)}>
            <UserAvatar name={member.name} size="xs" />
            <span className="truncate">{member.name}</span>
            {task.assignedTo?._id === member._id && (
              <Check className="ml-auto size-4" strokeWidth={1.75} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const KanbanBoard = ({ projectId }) => {
  const dispatch = useDispatch();
  const { items: tasks, isLoading } = useSelector(state => state.tasks);
  const { teamMembers } = useSelector(state => state.projects);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState('todo');
  const [openCommentsTaskId, setOpenCommentsTaskId] = useState(null);
  const [openActivityTaskId, setOpenActivityTaskId] = useState(null);
  const [openSubtasksTaskId, setOpenSubtasksTaskId] = useState(null);
  const [subtaskSummaries, setSubtaskSummaries] = useState({});
  const [editingPriority, setEditingPriority] = useState(null)
  const [editPriorityValue, setEditPriorityValue] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(null);
  const [editDueDateValue, setEditDueDateValue] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const { user } = useAuth();
  const { socket } = useSocket();

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

    const handleAttachmentAdded = ({ projectId: pid }) => {
      if (pid === projectId) dispatch(fetchTasks(projectId));
    };
    const handleAttachmentRemoved = ({ projectId: pid }) => {
      if (pid === projectId) dispatch(fetchTasks(projectId));
    };

    socket.on('attachment:added', handleAttachmentAdded);
    socket.on('attachment:removed', handleAttachmentRemoved);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('comment:added', handleCommentAdded);
      socket.off('attachment:added', handleAttachmentAdded);
      socket.off('attachment:removed', handleAttachmentRemoved);
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

    // Guard: only users with edit:task permission can drag tasks between columns
    if (!canEditTask) {
      setActiveTask(null);
      return;
    }

    const draggedTask = tasks.find(t => t._id === active.id);
    if (!draggedTask) {
      setActiveTask(null);
      return;
    }

    const newStatus = over.id;
    if (draggedTask.status === newStatus) {
      setActiveTask(null);
      return;
    }

    const originalStatus = draggedTask.status;
    dispatch(optimisticUpdateStatus({ taskId: draggedTask._id, newStatus }));

    try {
      await dispatch(updateTask({ id: draggedTask._id, data: { status: newStatus } })).unwrap();
    } catch {
      dispatch(revertTaskStatus({ taskId: draggedTask._id, originalStatus }));
      toast.error('Could not move the task', {
        description: 'Check your connection and try again.',
      });
    } finally {
      setActiveTask(null);
    }
  };

  const confirmDeleteTask = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteTask(deleteTarget._id));
      toast.success('Task deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Could not delete the task', {
        description: typeof err === 'string' ? err : 'Check your connection and try again.',
      });
    } finally {
      setDeleting(false);
    }
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
      toast.success('Task renamed');
    } catch (err) {
      toast.error('Could not rename the task', {
        description: typeof err === 'string' ? err : 'Check your connection and try again.',
      });
    }
  };

  const handleAssignTask = async (taskId, assignedTo) => {
    try {
      await dispatch(updateTask({
        id: taskId,
        data: { assignedTo: assignedTo || null }
      })).unwrap();
    } catch (err) {
      toast.error('Could not update the assignee', {
        description: typeof err === 'string' ? err : 'Check your connection and try again.',
      });
    }
  };

  //to update the priority 
  const handleUpdatePriority = async (taskId, newPriority) => {
    try {
      await dispatch(updateTask({ id: taskId, data: { priority: newPriority } })).unwrap();
    } catch {
      toast.error('Failed to update priority');
    }
    setEditingPriority(null);
    setEditPriorityValue('');
  };

  //to update the due date
  const handleUpdateDueDate = async (taskId, newDueDate) => {
    try {
      await dispatch(updateTask({ id: taskId, data: { dueDate: newDueDate || null } })).unwrap();
    } catch {
      toast.error('Failed to update due date');
    }
    setEditingDueDate(null);
    setEditDueDateValue('');
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
    toast.success('Task created');
  };

  const openAddTask = (status = 'todo') => {
    setAddTaskStatus(status);
    setShowAddTaskModal(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-h3 font-semibold text-foreground">Board</h2>
          <span className="text-micro text-faint tabular-nums">
            {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </span>
        </div>
        {canCreateTask && (
          <Button id="add-task-btn" size="sm" onClick={() => openAddTask('todo')}>
            <Plus className="size-4" strokeWidth={1.75} />
            New task
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className=" flex min-h-0 flex-1 gap-4 overflow-x-auto p-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[280px] flex-1 basis-0 space-y-3 rounded-lg border border-border bg-surface/50 p-3"
              >
                <div className="h-5 w-24 animate-pulse rounded-md bg-accent" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-accent" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-accent" />
              </div>
            ))
          ) : (
            Object.entries(statusConfig).map(([statusId, status]) => (
              <Droppable
                key={statusId}
                id={statusId}
                className="min-w-[280px] flex-1 basis-0"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={statusId} />
                      <h3 className="text-small font-semibold text-foreground">
                        {status.title}
                      </h3>
                      <span className="text-micro text-faint tabular-nums">
                        {getTaskCount(statusId)}
                      </span>
                    </div>
                    {canCreateTask && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Add task to ${status.title}`}
                        onClick={() => openAddTask(statusId)}
                      >
                        <Plus className="size-4" strokeWidth={1.75} />
                      </Button>
                    )}
                  </div>

                  <SortableContext
                    items={tasks.filter(t => t.status === statusId).map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
                      {tasks
                        .filter(task => task.status === statusId)
                        .map(task => (
                          <Draggable key={task._id} id={task._id}>
                            <Card className="gap-2 p-3.5 transition-colors duration-150 ease-kiln hover:border-primary/30">
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
                                      className="w-full rounded-xs border border-input bg-input px-2 py-1 text-small text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <h4 className="text-small font-medium text-foreground leading-snug">
                                      {task.title}
                                    </h4>
                                  )}
                                </div>

                                <div className="flex gap-0.5 opacity-0 transition-opacity duration-150 ease-kiln group-hover:opacity-100 shrink-0">
                                  {canEditTask && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Rename ${task.title}`}
                                      onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                    >
                                      <Pencil className="size-3.5" strokeWidth={1.75} />
                                    </Button>
                                  )}
                                  {canDeleteTask && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Delete ${task.title}`}
                                      className="text-muted-foreground hover:text-destructive"
                                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}
                                    >
                                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-small text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Attachment count badge */}
                              {task.attachments && task.attachments.length > 0 && (
                                <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
                                  <ImageIcon className="size-3" strokeWidth={1.75} />
                                  <span>{task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}

                              {task.priority || task.dueDate ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {task.priority && (
                                    canEditTask && editingPriority === task._id ? (
                                      <select
                                        value={editPriorityValue}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditPriorityValue(val);
                                          handleUpdatePriority(task._id, val);
                                        }}
                                        onBlur={() => handleUpdatePriority(task._id, editPriorityValue)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') { setEditingPriority(null); setEditPriorityValue(''); }
                                        }}
                                        autoFocus
                                        className="h-6 appearance-none rounded-xs border border-input bg-input px-1.5 text-micro text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                                      >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                      </select>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={!canEditTask}
                                        title={canEditTask ? 'Change priority' : undefined}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canEditTask) return;
                                          setEditingPriority(task._id);
                                          setEditPriorityValue(task.priority);
                                        }}
                                        className="rounded-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                      >
                                        <Badge variant={PRIORITY_BADGE[task.priority]?.variant || 'outline'}>
                                          {PRIORITY_BADGE[task.priority]?.label || task.priority}
                                        </Badge>
                                      </button>
                                    )
                                  )}

                                  {task.dueDate ? (
                                    canEditTask && editingDueDate === task._id ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="date"
                                          value={editDueDateValue}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setEditDueDateValue(val);
                                            handleUpdateDueDate(task._id, val);
                                          }}
                                          onBlur={() => handleUpdateDueDate(task._id, editDueDateValue)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Escape') { setEditingDueDate(null); setEditDueDateValue(''); }
                                          }}
                                          autoFocus
                                          className="h-6 rounded-xs border border-input bg-input px-1.5 text-micro text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                                        />
                                        <button
                                          onClick={() => handleUpdateDueDate(task._id, null)}
                                          className="rounded-xs p-0.5 text-faint transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                          title="Clear due date"
                                          aria-label="Clear due date"
                                        >
                                          <X className="size-3.5" strokeWidth={1.75} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={!canEditTask}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canEditTask) return;
                                          setEditingDueDate(task._id);
                                          setEditDueDateValue(new Date(task.dueDate).toISOString().split('T')[0]);
                                        }}
                                        className={cn(
                                          'inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-micro font-medium transition-colors duration-150 ease-kiln focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                          task.dueDate < new Date().toISOString().split('T')[0]
                                            ? 'border-destructive/40 bg-destructive/10 text-destructive'
                                            : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                                        )}
                                      >
                                        <CalendarDays className="size-3 shrink-0" strokeWidth={1.75} />
                                        {formatDate(task.dueDate)}
                                      </button>
                                    )
                                  ) : canEditTask && editingDueDate === task._id ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="date"
                                        value={editDueDateValue}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditDueDateValue(val);
                                          if (val) handleUpdateDueDate(task._id, val);
                                        }}
                                        onBlur={() => { if (editDueDateValue) handleUpdateDueDate(task._id, editDueDateValue); }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') { setEditingDueDate(null); setEditDueDateValue(''); }
                                        }}
                                        autoFocus
                                        className="h-6 rounded-xs border border-input bg-input px-1.5 text-micro text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                                      />
                                    </div>
                                  ) : canEditTask ? (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setEditingDueDate(task._id); setEditDueDateValue(''); }}
                                      className="inline-flex items-center gap-1 rounded-xs border border-dashed border-border px-1.5 py-0.5 text-micro font-medium text-faint transition-colors duration-150 ease-kiln hover:border-faint hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                      <CalendarDays className="size-3 shrink-0" strokeWidth={1.75} />
                                      Add date
                                    </button>
                                  ) : null}
                                </div>
                              ) : canEditTask ? (
                                <div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setEditingDueDate(task._id); setEditDueDateValue(''); }}
                                    className="inline-flex items-center gap-1 rounded-xs border border-dashed border-border px-1.5 py-0.5 text-micro font-medium text-faint transition-colors duration-150 ease-kiln hover:border-faint hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                  >
                                    <CalendarDays className="size-3 shrink-0" strokeWidth={1.75} />
                                    Add date
                                  </button>
                                </div>
                              ) : null}

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                {canEditTask ? (
                                  <AssigneeMenu
                                    task={task}
                                    members={teamMembers}
                                    onAssign={handleAssignTask}
                                  />
                                ) : task.assignedTo ? (
                                  <span className="flex items-center gap-1.5 text-micro text-muted-foreground">
                                    <UserAvatar name={task.assignedTo.name} size="xs" />
                                    {task.assignedTo.name}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-micro text-faint">
                                    <UserRound className="size-3" strokeWidth={1.75} />
                                    Unassigned
                                  </span>
                                )}

                                {task.createdAt && (
                                  <span className="text-micro text-faint shrink-0">
                                    {formatDate(task.createdAt)}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1.5 px-2 text-micro"
                                  title="View details"
                                  onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                >
                                  <Eye className="size-3" strokeWidth={1.75} />
                                  Details
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1.5 px-2 text-micro"
                                  onClick={(e) => { e.stopPropagation(); toggleComments(task._id); }}
                                >
                                  <MessageSquare className="size-3" strokeWidth={1.75} />
                                  {openCommentsTaskId === task._id ? 'Hide' : 'Comments'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1.5 px-2 text-micro"
                                  onClick={(e) => { e.stopPropagation(); toggleActivity(task._id); }}
                                >
                                  <Activity className="size-3" strokeWidth={1.75} />
                                  {openActivityTaskId === task._id ? 'Hide' : 'Activity'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1.5 px-2 text-micro"
                                  onClick={(e) => { e.stopPropagation(); toggleSubtasks(task._id); }}
                                >
                                  <ListChecks className="size-3" strokeWidth={1.75} />
                                  {openSubtasksTaskId === task._id
                                    ? 'Hide'
                                    : `Subtasks${subtaskSummaries[task._id] ? ` (${subtaskSummaries[task._id].completed}/${subtaskSummaries[task._id].total})` : ''}`}
                                </Button>
                              </div>

                              {openCommentsTaskId === task._id && (
                                <div className="mt-1">
                                  <TaskCommentsPanel taskId={task._id} />
                                </div>
                              )}

                              {openActivityTaskId === task._id && (
                                <div className="mt-1">
                                  <ActivityFeedPanel taskId={task._id} />
                                </div>
                              )}

                              {openSubtasksTaskId === task._id && (
                                <div className="mt-1">
                                  <SubtasksPanel
                                    taskId={task._id}
                                    onSummaryChange={(total, completed) => handleSubtaskSummary(task._id, total, completed)}
                                  />
                                </div>
                              )}
                            </Card>
                          </Draggable>
                        ))
                      }

                      {tasks.filter(task => task.status === statusId).length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center gap-1 py-10 text-center">
                          <p className="text-small text-faint">No tasks</p>
                          <p className="text-micro text-faint">Drag tasks here</p>
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
            <div className="w-72 rotate-1 rounded-lg border border-primary/30 bg-surface p-3.5 shadow-pop">
              <div className="text-small font-medium text-foreground">
                {activeTask.title}
              </div>
              {activeTask.description && (
                <div className="mt-1 line-clamp-2 text-small text-muted-foreground">
                  {activeTask.description}
                </div>
              )}
              {activeTask.assignedTo && (
                <div className="mt-2 flex items-center gap-1.5 text-micro text-muted-foreground">
                  <UserAvatar name={activeTask.assignedTo.name} size="xs" />
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
        defaultStatus={addTaskStatus}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        projectId={projectId}
        teamMembers={teamMembers}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} will be removed for everyone. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep task</AlertDialogCancel>
            <button
              type="button"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteTask();
              }}
              className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-small font-medium text-destructive-foreground transition-colors duration-150 ease-kiln hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete task'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KanbanBoard;
