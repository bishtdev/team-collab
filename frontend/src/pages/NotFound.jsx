import { Link } from 'react-router-dom';

import { ArchMotif } from '@/components/product/ArchMotif';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="kiln-grain relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-surface px-6 text-center">
      <div className="arch-backdrop absolute inset-0 opacity-60" />
      <ArchMotif className="pointer-events-none absolute -bottom-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 text-primary opacity-30" />
      <div className="relative space-y-3">
        <p className="font-mono text-small text-faint">404</p>
        <h1 className="text-h1 font-semibold text-foreground">
          This page doesn't exist
        </h1>
        <p className="text-small text-muted-foreground">
          The link may be old, or the page moved.
        </p>
        <Button asChild className="mt-2">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    </div>
  );
}
