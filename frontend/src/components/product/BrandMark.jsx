import { cn } from '@/lib/utils';

export function BrandMark({ className, wordmark = true, glyphClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-foreground', className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn('size-6 shrink-0', glyphClassName)}
      >
        <path
          d="M4.5 20v-7a7.5 7.5 0 0 1 15 0v7"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M10 20v-7a2 2 0 0 1 4 0v7"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          className="text-highlight"
        />
      </svg>
      {wordmark && (
        <span className="font-display text-[1.15rem] leading-none font-semibold tracking-[-0.02em]">
          Kiln
        </span>
      )}
    </span>
  );
}
