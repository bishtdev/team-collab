const Notification = require('../models/Notification');
const socketEmitter = require('./socketEmitter');

const createNotification = async ({ userId, type, title, message, taskId, projectId, actorId }) => {
  const notification = await Notification.create({
    userId, type, title, message, taskId, projectId, actorId
  });
  socketEmitter.emitToUser(userId, 'notification', notification);
  return notification;
};

exports.notifyTaskCreated = async (task, actor, teamId) => {
  const actorName = actor.name || actor.email;

  socketEmitter.emitToTeam(teamId, 'task:created', {
    taskId: task._id,
    projectId: task.projectId,
    actorName
  });

  if (task.assignedTo && task.assignedTo.toString() !== actor._id.toString()) {
    await createNotification({
      userId: task.assignedTo,
      type: 'task_created',
      title: 'New Task',
      message: `${actorName} assigned you to "${task.title}"`,
      taskId: task._id,
      projectId: task.projectId,
      actorId: actor._id
    });
  }
};

exports.notifyAssigneeChanged = async (task, newAssigneeId, actor, teamId) => {
  if (!newAssigneeId) return;
  if (newAssigneeId.toString() === actor._id.toString()) return;

  const actorName = actor.name || actor.email;

  socketEmitter.emitToTeam(teamId, 'task:updated', {
    taskId: task._id,
    projectId: task.projectId,
    actorName,
    changes: { field: 'assignedTo' }
  });

  await createNotification({
    userId: newAssigneeId,
    type: 'assignee_changed',
    title: 'Task Assigned',
    message: `${actorName} assigned you to "${task.title}"`,
    taskId: task._id,
    projectId: task.projectId,
    actorId: actor._id
  });
};

exports.notifyTaskUpdated = async (task, changedFields, actor, teamId) => {
  if (!task.assignedTo) return;
  if (task.assignedTo.toString() === actor._id.toString()) return;

  const actorName = actor.name || actor.email;

  socketEmitter.emitToTeam(teamId, 'task:updated', {
    taskId: task._id,
    projectId: task.projectId,
    actorName,
    changes: changedFields
  });

  await createNotification({
    userId: task.assignedTo,
    type: 'task_updated',
    title: 'Task Updated',
    message: `${actorName} updated "${task.title}" (${changedFields.join(', ')})`,
    taskId: task._id,
    projectId: task.projectId,
    actorId: actor._id
  });
};

exports.notifyTaskDeleted = async (task, actor, teamId) => {
  const actorName = actor.name || actor.email;

  socketEmitter.emitToTeam(teamId, 'task:deleted', {
    taskId: task._id,
    projectId: task.projectId,
    actorName
  });

  if (task.assignedTo && task.assignedTo.toString() !== actor._id.toString()) {
    await createNotification({
      userId: task.assignedTo,
      type: 'task_deleted',
      title: 'Task Deleted',
      message: `${actorName} deleted "${task.title}"`,
      taskId: task._id,
      projectId: task.projectId,
      actorId: actor._id
    });
  }
};

exports.notifyCommentAdded = async (comment, task, actor, teamId) => {
  const actorName = actor.name || actor.email;
  const actorId = actor._id.toString();

  // Collect potential recipients, excluding the commenter
  const recipientIds = new Set();
  if (task.assignedTo) recipientIds.add(task.assignedTo.toString());
  if (task.createdBy) recipientIds.add(task.createdBy.toString());
  recipientIds.delete(actorId);

  if (recipientIds.size === 0) return;

  socketEmitter.emitToTeam(teamId, 'comment:added', {
    taskId: task._id,
    commentId: comment._id,
    projectId: task.projectId,
    actorName
  });

  for (const userId of recipientIds) {
    await createNotification({
      userId,
      type: 'comment_added',
      title: 'New Comment',
      message: `${actorName} commented on "${task.title}"`,
      taskId: task._id,
      projectId: task.projectId,
      actorId: actor._id
    });
  }
};

exports.notifySubtaskChanged = async (subtask, task, actor, teamId) => {
  if (!task.assignedTo) return;
  if (task.assignedTo.toString() === actor._id.toString()) return;

  const actorName = actor.name || actor.email;

  socketEmitter.emitToTeam(teamId, 'subtask:updated', {
    taskId: task._id,
    subtaskId: subtask._id,
    completed: subtask.completed,
    projectId: task.projectId,
    actorName
  });

  const action = subtask.completed ? 'completed' : 'uncompleted';
  await createNotification({
    userId: task.assignedTo,
    type: subtask.completed ? 'subtask_completed' : 'subtask_uncompleted',
    title: subtask.completed ? 'Subtask Completed' : 'Subtask Uncompleted',
    message: `${actorName} ${action} "${subtask.title}" on "${task.title}"`,
    taskId: task._id,
    projectId: task.projectId,
    actorId: actor._id
  });
};
