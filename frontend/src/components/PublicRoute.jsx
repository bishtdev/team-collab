import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading, firebaseUser } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If user is logged in, redirect to projects
  if (firebaseUser && user) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

export default PublicRoute;
