import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiEdit2, FiCheck, FiTrash2, FiPaperclip, FiImage, FiUpload, FiCalendar, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { updateTask, uploadAttachments, deleteAttachment } from '../../features/tasks/tasksSlice';
import SubtasksPanel from '../SubtasksPanel';
import TaskCommentsPanel from '../TaskCommentsPanel';
import ActivityFeedPanel from '../ActivityFeedPanel';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;

const priorityColors = {
  low: 'text-gray-400 bg-gray-800',
  medium: 'text-yellow-400 bg-yellow-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  urgent: 'text-red-400 bg-red-500/10',
};

const statusColors = {
  'todo': 'text-gray-400 bg-gray-800',
  'in-progress': 'text-blue-400 bg-blue-500/10',
  'done': 'text-emerald-400 bg-emerald-500/10',
};

const statusLabels = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

const TaskDetailModal = ({ isOpen, onClose, task: initialTask, projectId, teamMembers = [] }) => {
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 my-8 animate-modalSlideIn">
          {/* ---- Header ---- */}
          <div className="sticky top-0 bg-gray-900 rounded-t-2xl border-b border-gray-800 px-6 py-4 flex items-start justify-between gap-4 z-10">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleSaveTitle}
                    className="flex-1 text-xl font-semibold bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                    <FiCheck className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-xl font-semibold text-white truncate">{task?.title}</h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-gray-300 transition-all"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task?.status]}`}>
                  {statusLabels[task?.status]}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task?.priority]}`}>
                  {task?.priority}
                </span>
                {task?.dueDate && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FiCalendar className="w-3 h-3" />
                    {formatDate(task.dueDate)}
                  </span>
                )}
                {assignedUser && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FiUser className="w-3 h-3" />
                    {assignedUser.name}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* ---- Body ---- */}
          <div className="p-6">
            {localError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {localError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Description + Attachments */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <section>
                  <div className="flex items-center justify-between group mb-2">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Description</h3>
                    {!isEditingDesc && (
                      <button
                        onClick={() => setIsEditingDesc(true)}
                        className="p-1 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-gray-300 transition-all"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {isEditingDesc ? (
                    <div className="space-y-2">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm resize-none"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveDescription}
                          disabled={isMutating}
                          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setDescription(task.description || ''); setIsEditingDesc(false); }}
                          className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 hover:bg-gray-800 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {task?.description || <span className="text-gray-600 italic">No description</span>}
                    </p>
                  )}
                </section>

                {/* Attachments Gallery */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Attachments {totalAttachmentCount > 0 && <span className="text-gray-600">({totalAttachmentCount})</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedFiles.length > 0 && (
                        <button
                          onClick={handleUploadFiles}
                          disabled={isMutating}
                          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <FiUpload className="w-3.5 h-3.5" />
                          Upload ({selectedFiles.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={totalAttachmentCount >= MAX_FILES}
                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40"
                        title="Add attachments"
                      >
                        <FiPaperclip className="w-4 h-4" />
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
                  </div>

                  {/* Pending uploads */}
                  {filePreviews.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-yellow-400 mb-2">Pending upload — click "Upload" to save</p>
                      <div className="flex flex-wrap gap-2">
                        {filePreviews.map((preview, idx) => (
                          <div key={idx} className="relative group">
                            <img src={preview.url} alt={preview.name} className="w-20 h-20 rounded-lg object-cover border border-yellow-700/50" />
                            <button
                              type="button"
                              onClick={() => removePendingFile(idx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing attachments grid */}
                  {attachments.length === 0 && filePreviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                      <FiImage className="w-8 h-8 mb-2" />
                      <p className="text-sm">No attachments yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {attachments.map((att, idx) => (
                        <div key={att.key || idx} className="relative group">
                          <button
                            onClick={() => setLightboxIndex(attachments.findIndex((a) => a.key === att.key))}
                            className="w-full aspect-square rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors"
                          >
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white truncate">{att.name}</p>
                            <p className="text-[9px] text-gray-400">{formatFileSize(att.size)}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteAttachment(att.key)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <FiTrash2 className="w-3 h-3 text-white" />
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
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-10"
          >
            <FiX className="w-6 h-6" />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-10"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          {lightboxIndex < attachments.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-10"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={attachments[lightboxIndex].url}
              alt={attachments[lightboxIndex].name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-center text-sm text-gray-400 mt-3">
              {attachments[lightboxIndex].name} — {formatFileSize(attachments[lightboxIndex].size)}
              <span className="text-gray-600"> ({lightboxIndex + 1} of {attachments.length})</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskDetailModal;
