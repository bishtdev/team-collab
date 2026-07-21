import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../features/tasks/subtasksSlice';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const SubtasksPanel = ({ taskId, onSummaryChange }) => {
  const dispatch = useDispatch();
  const subtaskState = useSelector(state => state.subtasks[taskId]);
  const subtasks = useMemo(() => subtaskState?.items || [], [subtaskState?.items]);
  const isLoading = subtaskState?.isLoading || false;

  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [togglingIds, setTogglingIds] = useState(new Set());
  const inputRef = useRef(null);

  const emitSummary = useCallback((list) => {
    if (onSummaryChange) {
      const total = list.length;
      const completed = list.filter(s => s.completed).length;
      onSummaryChange(total, completed);
    }
  }, [onSummaryChange]);

  useEffect(() => {
    if (taskId) dispatch(fetchSubtasks(taskId));
  }, [taskId, dispatch]);

  useEffect(() => {
    emitSummary(subtasks);
  }, [subtasks, emitSummary]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    try {
      await dispatch(createSubtask({ taskId, data: { title } })).unwrap();
      setNewTitle('');
      inputRef.current?.focus();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to add subtask');
    }
  };

  const handleToggle = async (subtask) => {
    if (togglingIds.has(subtask._id)) return;

    const newCompleted = !subtask.completed;
    try {
      await dispatch(updateSubtask({ taskId, subtaskId: subtask._id, data: { completed: newCompleted } })).unwrap();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update subtask');
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(subtask._id);
        return next;
      });
    }
  };

  const handleDelete = async (subtaskId) => {
    try {
      await dispatch(deleteSubtask({ taskId, subtaskId })).unwrap();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete subtask');
    }
  };

  return (
    <section className="bg-gray-900/60 p-3 sm:p-4 rounded-xl border border-gray-800/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Subtasks</h3>
        {!isLoading && subtasks.length > 0 && (
          <span className="text-xs text-gray-400">
            {subtasks.filter(s => s.completed).length}/{subtasks.length}
          </span>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="flex-1 min-w-0 bg-gray-800/50 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-white text-gray-900 rounded-md text-sm font-medium disabled:opacity-50 transition-opacity whitespace-nowrap sm:w-auto w-full"
        >
          <FiPlus className="w-3.5 h-3.5" />
          Add
        </button>
      </form>

      {error && <div className="mb-2 text-xs text-red-400">{error}</div>}

      <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin space-y-1">
        {isLoading && subtasks.length === 0 ? (
          <div className="text-xs text-gray-400 py-2">Loading subtasks...</div>
        ) : subtasks.length === 0 && !isLoading ? (
          <div className="text-xs text-gray-500 py-2">No subtasks yet - add one above.</div>
        ) : (
          subtasks.map((s) => (
            <div
              key={s._id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-800/40 group transition-colors"
            >
              <input
                type="checkbox"
                checked={s.completed}
                onChange={() => handleToggle(s)}
                disabled={togglingIds.has(s._id)}
                className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 accent-white cursor-pointer shrink-0"
              />
              <span
                className={`flex-1 text-sm leading-snug break-words min-w-0 ${
                  s.completed ? 'line-through text-gray-500' : 'text-gray-200'
                }`}
              >
                {s.title}
              </span>
              {s.assigneeId && (
                <span className="text-[10px] text-gray-500 shrink-0 hidden sm:inline">
                  {s.assigneeId.name}
                </span>
              )}
              <button
                onClick={() => handleDelete(s._id)}
                className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-950/50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="Delete subtask"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default SubtasksPanel;
