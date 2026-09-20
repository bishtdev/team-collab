import { cn } from '@/lib/utils';

export function PageHeader({ title, description, children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-h1 font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="max-w-prose text-small text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
