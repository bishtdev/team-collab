import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Check, ChevronLeft, ChevronRight, Image, Paperclip, Pencil, Trash2, Upload, X } from 'lucide-react';
import { updateTask, uploadAttachments, deleteAttachment } from '../../features/tasks/tasksSlice';
import SubtasksPanel from '../SubtasksPanel';
import TaskCommentsPanel from '../TaskCommentsPanel';
import ActivityFeedPanel from '../ActivityFeedPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/product/EmptyState';
import { StatusBadge } from '@/components/product/StatusBadge';
import { UserAvatar } from '@/components/product/UserAvatar';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;

const priorityVariants = {
  low: 'outline',
  medium: 'teal',
  high: 'gilt',
  urgent: 'rust',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const TaskDetailModal = ({ isOpen, onClose, task: initialTask, projectId, teamMembers = [] }) => {
  void projectId;
  const dispatch = useDispatch();
  const { isMutating } = useSelector((state) => state.tasks);
  const fileInputRef = useRef(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [localError, setLocalError] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Synced task from props
  const task = initialTask;

  // Sync state when task changes
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAttachments(task.attachments || []);
      setLocalError('');
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setLightboxIndex(null);
      setSelectedFiles([]);
      setFilePreviews([]);
    }
  }, [task?._id, isOpen]);

  // Lock background scroll + keyboard nav for lightbox
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i > 0 ? i - 1 : i));
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i < attachments.length - 1 ? i + 1 : i));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, attachments.length]);

  // ---- Title Editing ----
  const handleSaveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed === task.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await dispatch(updateTask({ id: task._id, data: { title: trimmed } })).unwrap();
      setIsEditingTitle(false);
    } catch {
      setLocalError('Failed to update title');
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  // ---- Description Editing ----
  const handleSaveDescription = async () => {
    const trimmed = description.trim();
    if (trimmed === (task.description || '').trim()) {
      setIsEditingDesc(false);
      return;
    }
    try {
      await dispatch(updateTask({ id: task._id, data: { description: trimmed } })).unwrap();
      setIsEditingDesc(false);
    } catch {
      setLocalError('Failed to update description');
    }
  };

  // ---- File Upload ----
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": unsupported format.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}": exceeds 5 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    const total = attachments.length + selectedFiles.length + validFiles.length;
    if (total > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files per task.`);
      const slotsLeft = MAX_FILES - attachments.length - selectedFiles.length;
      validFiles.splice(slotsLeft);
    }

    if (errors.length > 0) setLocalError(errors.join(' '));

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      const newPreviews = validFiles.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        name: f.name,
      }));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index) => {
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    try {
      await dispatch(uploadAttachments({ taskId: task._id, files: selectedFiles })).unwrap();
      // Refresh attachments from store — the task in Redux store is updated
      filePreviews.forEach((p) => URL.revokeObjectURL(p.url));
      setSelectedFiles([]);
      setFilePreviews([]);
      setLocalError('');
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : 'Upload failed');
    }
  };

  const handleDeleteAttachment = async (key) => {
    try {
      await dispatch(deleteAttachment({ taskId: task._id, key })).unwrap();
      setAttachments((prev) => prev.filter((a) => a.key !== key));
    } catch {
      setLocalError('Failed to delete attachment');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const assignedUser = teamMembers.find((m) => m._id === task?.assignedTo);

  if (!isOpen) return null;

  const totalAttachmentCount = attachments.length + selectedFiles.length;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-overlay backdrop-blur-[2px] sm:items-center sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-popover shadow-overlay animate-modalSlideIn sm:max-h-[88vh] sm:max-w-2xl sm:rounded-xl lg:max-w-4xl"
        >
          {/* ---- Header ---- */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-popover px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleSaveTitle}
                    className="h-10 min-w-0 flex-1 font-display text-h3 font-semibold"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSaveTitle}
                    aria-label="Save title"
                    className="shrink-0"
                  >
                    <Check className="size-4" strokeWidth={1.75} />
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <h2 className="truncate font-display text-h3 font-semibold text-foreground sm:text-h2">{task?.title}</h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    aria-label="Edit title"
                    className="shrink-0 rounded-xs p-1 text-faint opacity-0 transition-all duration-150 ease-kiln hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none group-hover:opacity-100"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <StatusBadge status={task?.status} />
                <Badge variant={priorityVariants[task?.priority] || 'outline'}>
                  {priorityLabels[task?.priority] || task?.priority}
                </Badge>
                {task?.dueDate && (
                  <span className="flex items-center gap-1 whitespace-nowrap text-micro text-muted-foreground">
                    <Calendar className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {formatDate(task.dueDate)}
                  </span>
                )}
                {assignedUser && (
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-micro text-muted-foreground">
                    <UserAvatar name={assignedUser.name} size="xs" />
                    {assignedUser.name}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0"
            >
              <X className="size-4" strokeWidth={1.75} />
            </Button>
          </div>

          {/* ---- Body (scrolls independently of header) ---- */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {localError && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
                {localError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Left Column: Description + Attachments */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">
                {/* Description */}
                <section>
                  <div className="group mb-2 flex items-center justify-between">
                    <h3 className="text-small font-medium text-muted-foreground">Description</h3>
                    {!isEditingDesc && (
                      <button
                        onClick={() => setIsEditingDesc(true)}
                        aria-label="Edit description"
                        className="rounded-xs p-1 text-faint opacity-0 transition-all duration-150 ease-kiln hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none group-hover:opacity-100"
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                  {isEditingDesc ? (
                    <div className="space-y-2">
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="resize-none"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveDescription}
                          disabled={isMutating}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setDescription(task.description || ''); setIsEditingDesc(false); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-body leading-relaxed text-foreground">
                      {task?.description || <span className="italic text-faint">No description</span>}
                    </p>
                  )}
                </section>

                {/* Attachments Gallery */}
                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-small font-medium text-muted-foreground">
                      Attachments {totalAttachmentCount > 0 && <span className="text-faint">({totalAttachmentCount})</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedFiles.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUploadFiles}
                          disabled={isMutating}
                        >
                          <Upload className="size-4" strokeWidth={1.75} />
                          <span className="hidden xs:inline">Upload</span> ({selectedFiles.length})
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={totalAttachmentCount >= MAX_FILES}
                        title="Add attachments"
                        aria-label="Add attachments"
                      >
                        <Paperclip className="size-4" strokeWidth={1.75} />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Pending uploads */}
                  {filePreviews.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-micro text-warning">Pending upload — tap "Upload" to save</p>
                      <div className="flex flex-wrap gap-2">
                        {filePreviews.map((preview, idx) => (
                          <div key={idx} className="group relative">
                            <img src={preview.url} alt={preview.name} className="size-16 rounded-md border border-warning/40 object-cover sm:size-20" />
                            <button
                              type="button"
                              onClick={() => removePendingFile(idx)}
                              aria-label={`Remove ${preview.name}`}
                              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-100 transition-opacity duration-150 ease-kiln hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <X className="size-3" strokeWidth={1.75} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing attachments grid */}
                  {attachments.length === 0 && filePreviews.length === 0 ? (
                    <EmptyState
                      icon={Image}
                      title="No attachments yet"
                      className="py-8"
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
                      {attachments.map((att, idx) => (
                        <div key={att.key || idx} className="group relative">
                          <button
                            onClick={() => setLightboxIndex(attachments.findIndex((a) => a.key === att.key))}
                            className="aspect-square w-full overflow-hidden rounded-lg border border-border transition-colors duration-150 ease-kiln hover:border-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <img
                              src={att.url}
                              alt={att.name}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          </button>
                          <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-background/85 p-2 opacity-100 transition-opacity duration-150 ease-kiln sm:opacity-0 sm:group-hover:opacity-100">
                            <p className="truncate text-micro text-foreground">{att.name}</p>
                            <p className="text-micro text-muted-foreground">{formatFileSize(att.size)}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteAttachment(att.key)}
                            aria-label={`Delete ${att.name}`}
                            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-100 transition-opacity duration-150 ease-kiln hover:bg-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="size-3" strokeWidth={1.75} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Subtasks + Comments */}
              <div className="space-y-4">
                <SubtasksPanel taskId={task?._id} />
                <TaskCommentsPanel taskId={task?._id} />
                <ActivityFeedPanel taskId={task?._id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && attachments[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay p-3 backdrop-blur-[2px] sm:p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
            className="absolute right-3 top-3 z-10 shadow-pop sm:right-4 sm:top-4"
          >
            <X className="size-4" strokeWidth={1.75} />
          </Button>

          {lightboxIndex > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              aria-label="Previous image"
              className="absolute left-1.5 z-10 shadow-pop sm:left-4"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} />
            </Button>
          )}

          {lightboxIndex < attachments.length - 1 && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              aria-label="Next image"
              className="absolute right-1.5 z-10 shadow-pop sm:right-4"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} />
            </Button>
          )}

          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={attachments[lightboxIndex].url}
              alt={attachments[lightboxIndex].name}
              className="max-h-[75vh] max-w-full rounded-lg object-contain sm:max-h-[85vh]"
            />
            <p className="mt-3 px-4 text-center text-small text-muted-foreground">
              {attachments[lightboxIndex].name} — {formatFileSize(attachments[lightboxIndex].size)}
              <span className="text-faint"> ({lightboxIndex + 1} of {attachments.length})</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskDetailModal;