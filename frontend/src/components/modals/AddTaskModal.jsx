import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPaperclip, FiX } from 'react-icons/fi';
import Modal from '../Modal';
import { createTask, uploadAttachments } from '../../features/tasks/tasksSlice';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const AddTaskModal = ({ isOpen, onClose, projectId, teamMembers = [], onSuccess }) => {
  const dispatch = useDispatch();
  const { isMutating } = useSelector((state) => state.tasks);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setError('');
      setDueDate('');
      setPriority('medium');
      setSelectedFiles([]);
      setFilePreviews([]);
    }
  }, [isOpen]);

  /** Validate and add files to the selection */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": unsupported format. Use JPEG, PNG, GIF, WebP, or SVG.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}": exceeds 5 MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    const total = selectedFiles.length + validFiles.length;
    if (total > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files allowed. You selected ${validFiles.length}, have ${selectedFiles.length} already selected.`);
      // Only take what fits
      const slotsLeft = MAX_FILES - selectedFiles.length;
      validFiles.splice(slotsLeft);
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);

      // Generate preview URLs
      const newPreviews = validFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }

    // Reset the input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Remove a file from the selection */
  const removeFile = (index) => {
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setError('');

    try {
      // Step 1: Create the task
      const result = await dispatch(createTask({
        title,
        description,
        status: 'todo',
        projectId,
        assignedTo: assignedTo || null,
        dueDate,
        priority,
      })).unwrap();

      // Step 2: Upload attachments if any
      if (selectedFiles.length > 0) {
        await dispatch(uploadAttachments({
          taskId: result._id,
          files: selectedFiles,
        })).unwrap();
      }

      // Cleanup preview URLs
      filePreviews.forEach((p) => URL.revokeObjectURL(p.url));

      onSuccess?.(result);
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create task.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Task"
      subtitle="Create a new task for this project"
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
            placeholder="e.g., Design landing page header"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm resize-none"
            placeholder="Add more details..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Assign To
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm appearance-none"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm appearance-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* ---- Attachments Section ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Attachments {selectedFiles.length > 0 && <span className="text-gray-600">({selectedFiles.length}/{MAX_FILES})</span>}
          </label>

          {/* File Preview Thumbnails */}
          {filePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {filePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-3 h-3 text-white" />
                  </button>
                  <div className="absolute -bottom-1 left-0 right-0 text-[9px] text-center text-gray-400 truncate px-1 bg-gray-900/80 rounded-b-lg">
                    {formatFileSize(preview.file.size)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File Input Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedFiles.length >= MAX_FILES}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiPaperclip className="w-4 h-4" />
            {selectedFiles.length >= MAX_FILES ? 'Max files reached' : 'Add images (JPEG, PNG, GIF, WebP, SVG)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-800 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isMutating}
            className="px-5 py-2.5 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isMutating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Task</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;
