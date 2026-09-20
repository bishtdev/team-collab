import { cn } from '@/lib/utils';

export function Kbd({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border bg-surface px-1.5 font-mono text-[0.65rem] text-muted-foreground',
        className
      )}
    >
      {children}
    </kbd>
  );
}
