// controllers/attachmentController.js
// Handles uploading, listing, and deleting image attachments for tasks.
// Uses Cloudinary for file storage with multer for multipart parsing.
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const cloudinaryService = require('../services/cloudinaryService');
const notificationService = require('../services/notificationService');

/**
 * Verify that the user has access to the task's project team.
 * Returns the task if authorized, or sends an error response.
 */
const verifyTaskAccess = async (taskId, userId, userTeamId, res) => {
  const task = await Task.findById(taskId)
    .populate({ path: 'projectId', select: 'teamId' });

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return null;
  }

  if (!task.projectId || !task.projectId.teamId) {
    res.status(500).json({ error: 'Task ownership data is missing' });
    return null;
  }

  if (task.projectId.teamId.toString() !== userTeamId?.toString()) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }

  return task;
};

/**
 * POST /api/tasks/:taskId/attachments
 * Upload image files and attach them to a task.
 * Accepts multipart/form-data with field name "images".
 */
exports.uploadAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded. Please select at least one image.' });
    }

    const task = await verifyTaskAccess(taskId, req.user._id, req.user.teamId, res);
    if (!task) return;

    // Upload to Cloudinary
    const attachments = await cloudinaryService.uploadFiles(req.files, taskId, req.user._id);

    // Append to task's attachments array
    task.attachments.push(...attachments);
    await task.save();

    // Log activity
    await Activity.create({
      taskId,
      actorId: req.user._id,
      action: 'attachment_added',
      details: {
        count: attachments.length,
        names: attachments.map((a) => a.name),
      },
    });

    // Send notifications
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await notificationService.notifyAttachmentAdded(task, attachments, req.user, req.user.teamId);
    }

    // Emit real-time event
    const { getIO } = require('../services/socketEmitter');
    const io = getIO();
    if (io) {
      io.to(req.user.teamId.toString()).emit('attachment:added', {
        taskId: task._id,
        projectId: task.projectId?._id || task.projectId,
        attachments,
        actorName: req.user.name || req.user.email,
      });
    }

    res.status(201).json({ attachments, task });
  } catch (err) {
    console.error('Upload attachments error:', err);
    if (err.message?.includes('not supported') || err.message?.includes('exceeds') || err.message?.includes('Maximum')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to upload attachments', details: err.message });
  }
};

/**
 * DELETE /api/tasks/:taskId/attachments/:key
 * Delete a specific attachment from a task and S3.
 */
exports.deleteAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachmentKey = decodeURIComponent(req.params.key);

    const task = await verifyTaskAccess(taskId, req.user._id, req.user.teamId, res);
    if (!task) return;

    // Find the attachment in the task's array
    const attachment = task.attachments.find((a) => a.key === attachmentKey);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteFile(attachmentKey);

    // Remove from task's attachments array
    task.attachments = task.attachments.filter((a) => a.key !== attachmentKey);
    await task.save();

    // Log activity
    await Activity.create({
      taskId,
      actorId: req.user._id,
      action: 'attachment_removed',
      details: { name: attachment.name, key: attachmentKey },
    });

    // Emit real-time event
    const { getIO } = require('../services/socketEmitter');
    const io = getIO();
    if (io) {
      io.to(req.user.teamId.toString()).emit('attachment:removed', {
        taskId: task._id,
        projectId: task.projectId?._id || task.projectId,
        key: attachmentKey,
        actorName: req.user.name || req.user.email,
      });
    }

    res.json({ message: 'Attachment deleted', task });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ error: 'Failed to delete attachment', details: err.message });
  }
};

/**
 * GET /api/tasks/:taskId/attachments
 * List all attachments for a task.
 */
exports.getAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await verifyTaskAccess(taskId, req.user._id, req.user.teamId, res);
    if (!task) return;

    res.json({ attachments: task.attachments || [] });
  } catch (err) {
    console.error('Get attachments error:', err);
    res.status(500).json({ error: 'Failed to fetch attachments', details: err.message });
  }
};
