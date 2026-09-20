import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, children, className }) {
  return (
    <div
      className={cn(
        'kiln-grain flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <div className="relative flex size-11 items-center justify-center rounded-full bg-accent text-muted-foreground">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      )}
      <h2 className="relative text-h3 font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="relative max-w-sm text-small text-muted-foreground">{description}</p>
      )}
      {children && <div className="relative mt-2">{children}</div>}
    </div>
  );
}
