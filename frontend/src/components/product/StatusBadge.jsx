import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS = {
  todo: {
    label: 'To do',
    classes: 'border-status-todo/30 bg-status-todo/10 text-status-todo',
    dot: 'bg-status-todo',
  },
  'in-progress': {
    label: 'In progress',
    classes: 'border-status-progress/30 bg-status-progress/10 text-status-progress',
    dot: 'bg-status-progress',
  },
  done: {
    label: 'Done',
    classes: 'border-status-done/30 bg-status-done/10 text-status-done',
    dot: 'bg-status-done',
  },
};

export const TASK_STATUSES = Object.keys(STATUS);

export function StatusBadge({ status, className, showDot = true }) {
  const config = STATUS[status] || STATUS.todo;

  return (
    <Badge variant="outline" className={cn('gap-1.5', config.classes, className)}>
      {showDot && <span className={cn('size-1.5 rounded-full', config.dot)} />}
      {config.label}
    </Badge>
  );
}

export function StatusDot({ status, className }) {
  const config = STATUS[status] || STATUS.todo;
  return <span className={cn('inline-block size-2 rounded-full', config.dot, className)} />;
}
