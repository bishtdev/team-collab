import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Projects from './pages/Projects';
import ProjectKanban from './pages/ProjectKanban';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TeamSetup from './pages/TeamSetup';
import ChatPage from './components/ChatPage';
import { Toaster } from '@/components/ui/sonner';

const ChatWrapper = () => {
  const { user } = useAuth();
  return <ChatPage teamId={user?.teamId} currentUser={user} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
        <Routes>
          {/* Public routes — Auth layout (no sidebar) */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <Login />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <AuthLayout>
                  <Signup />
                </AuthLayout>
              </PublicRoute>
            }
          />

          {/* Protected routes — App layout (sidebar + header) */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Projects />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:id/kanban"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectKanban />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup-team"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TeamSetup />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ChatWrapper />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
