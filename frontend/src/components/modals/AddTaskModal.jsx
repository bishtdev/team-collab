import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Paperclip, X } from 'lucide-react';
import Modal from '../Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTask, uploadAttachments } from '../../features/tasks/tasksSlice';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const AddTaskModal = ({ isOpen, onClose, projectId, teamMembers = [], onSuccess, defaultStatus = 'todo' }) => {
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
        status: defaultStatus || 'todo',
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
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="add-task-title" className="mb-1.5">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="add-task-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Design landing page header"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="add-task-description" className="mb-1.5">
            Description
          </Label>
          <Textarea
            id="add-task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            placeholder="Add more details..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="add-task-assignee" className="mb-1.5">
            Assign To
          </Label>
          <select
            id="add-task-assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-input px-3 text-small text-foreground transition-[border-color,box-shadow] duration-150 ease-kiln outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
          <Label htmlFor="add-task-due-date" className="mb-1.5">
            Due Date
          </Label>
          <Input
            id="add-task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="add-task-priority" className="mb-1.5">
            Priority
          </Label>
          <select
            id="add-task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-input px-3 text-small text-foreground transition-[border-color,box-shadow] duration-150 ease-kiln outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* ---- Attachments Section ---- */}
        <div>
          <Label className="mb-1.5">
            Attachments {selectedFiles.length > 0 && <span className="text-faint">({selectedFiles.length}/{MAX_FILES})</span>}
          </Label>

          {/* File Preview Thumbnails */}
          {filePreviews.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {filePreviews.map((preview, idx) => (
                <div key={idx} className="group relative">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="size-16 rounded-md border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${preview.name}`}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity duration-150 ease-kiln group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <X className="size-3" strokeWidth={1.75} />
                  </button>
                  <div className="absolute inset-x-0 -bottom-1 truncate rounded-b-md bg-popover/90 px-1 text-center text-micro text-muted-foreground">
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
            className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-small text-muted-foreground transition-colors duration-150 ease-kiln hover:border-faint hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Paperclip className="size-4" strokeWidth={1.75} />
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
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isMutating}
            disabled={isMutating}
          >
            {isMutating ? 'Creating…' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;
