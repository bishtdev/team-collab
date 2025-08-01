import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import KanbanBoard from './components/KanbanBoard';
import Chat from './components/Chat';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/kanban"
              element={
                <ProtectedRoute>
                  {/* extract projectId from params and pass to KanbanBoard */}
                  <KanbanBoardWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatWrapper />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

// wrappers to get params (simplified)
import { useParams } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
const KanbanBoardWrapper = () => {
  const { id } = useParams();
  return <KanbanBoard projectId={id} />;
};
const ChatWrapper = () => {
  const { user } = useAuth();
  return <Chat teamId={user?.teamId} />;
};

export default App;
