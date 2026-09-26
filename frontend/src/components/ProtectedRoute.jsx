import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, WifiOff } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useOrgStatus } from '../hooks/useOrgStatus';
import { Button } from '@/components/ui/button';

const Centered = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">{children}</div>
);

const Loading = () => (
  <Centered>
    <Loader2 className="size-5 animate-spin text-muted-foreground" />
  </Centered>
);

const Unreachable = ({ onRetry, retrying }) => (
  <Centered>
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-surface p-8 text-center shadow-card">
      <div className="flex size-11 items-center justify-center rounded-full bg-accent text-muted-foreground">
        <WifiOff className="size-5" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <h2 className="text-h3 font-semibold text-foreground">
          We couldn't reach your workspace
        </h2>
        <p className="text-small text-muted-foreground">
          The server didn't respond. Check your connection and try again.
        </p>
      </div>
      <Button onClick={onRetry} loading={retrying} className="w-full">
        Try again
      </Button>
    </div>
  </Centered>
);

// Route guard. requireOrg=true (default) = app surfaces that need a workspace;
// requireOrg=false = onboarding, which only makes sense without one.
// This is what sends a freshly signed-up (0-org) user to /onboarding instead of
// dropping them on an empty /projects.
const ProtectedRoute = ({ children, requireOrg = true }) => {
  const { user, loading, firebaseUser, refreshUser } = useAuth();
  const { status, orgCount, refresh } = useOrgStatus();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      if (refreshUser) await refreshUser();
      refresh();
    } catch {
      /* the panel below stays visible */
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <Loading />;

  if (!firebaseUser) return <Navigate to="/login" replace />;

  // Signed in on Firebase but the backend user is missing (sync failed).
  if (!user) return <Unreachable onRetry={retry} retrying={retrying} />;

  // Don't route on orgs until the list has settled — otherwise every user would
  // flick through /onboarding while the request is still in flight.
  if (status === 'idle' || status === 'loading') return <Loading />;
  if (status === 'failed') return <Unreachable onRetry={retry} retrying={retrying} />;

  if (requireOrg && orgCount === 0) return <Navigate to="/onboarding" replace />;
  if (!requireOrg && orgCount > 0) return <Navigate to="/projects" replace />;

  return children;
};

export default ProtectedRoute;
