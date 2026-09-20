import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { fetchSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../features/tasks/subtasksSlice';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/product/EmptyState';

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
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-small font-semibold text-foreground">Subtasks</h3>
        {!isLoading && subtasks.length > 0 && (
          <span className="text-micro tabular-nums text-faint">
            {subtasks.filter(s => s.completed).length}/{subtasks.length}
          </span>
        )}
      </div>

      <form onSubmit={handleAdd} className="mb-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-input px-3 text-small text-foreground transition-[border-color,box-shadow] duration-150 ease-kiln outline-none placeholder:text-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <Button
          type="submit"
          disabled={!newTitle.trim()}
          className="w-full whitespace-nowrap sm:w-auto"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Add
        </Button>
      </form>

      {error && <div className="mb-2 text-small text-destructive">{error}</div>}

      <div className="max-h-64 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        {isLoading && subtasks.length === 0 ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        ) : subtasks.length === 0 && !isLoading ? (
          <EmptyState
            icon={ListChecks}
            title="No subtasks yet"
            description="Add one above to break this task into steps."
            className="border-0 bg-transparent px-4 py-6"
          />
        ) : (
          subtasks.map((s) => (
            <div
              key={s._id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={s.completed}
                onChange={() => handleToggle(s)}
                disabled={togglingIds.has(s._id)}
                aria-label={`Mark ${s.title} as ${s.completed ? 'incomplete' : 'complete'}`}
                className="size-4 shrink-0 cursor-pointer rounded-xs border-border accent-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span
                className={`min-w-0 flex-1 break-words text-small leading-snug ${
                  s.completed ? 'text-faint line-through' : 'text-foreground'
                }`}
              >
                {s.title}
              </span>
              {s.assigneeId && (
                <span className="hidden shrink-0 text-micro text-faint sm:inline">
                  {s.assigneeId.name}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(s._id)}
                className="shrink-0 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                title="Delete subtask"
                aria-label="Delete subtask"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default SubtasksPanel;
