import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, WifiOff } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children }) => {
  const { user, loading, firebaseUser, refreshUser } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      if (refreshUser) await refreshUser();
    } catch {
      /* the panel below stays visible */
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
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
          <Button onClick={retry} loading={retrying} className="w-full">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
