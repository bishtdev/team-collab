import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import KanbanBoard from './components/KanbanBoard';
import ProtectedRoute from './components/ProtectedRoute';
import { useParams } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TeamSetup from './pages/TeamSetup';
import ProjectKanban from './pages/ProjectKanban';
import ChatPage from './components/ChatPage';
import { Toaster } from '@/components/ui/sonner';

const KanbanBoardWrapper = () => {
  const { id } = useParams(); // project id
  return (
    <div>
      <ProjectHeader projectId={id} /> {/* fetch & show name/desc */}
      <KanbanBoard projectId={id} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path='/' element={<Navigate to="/signup" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path='/setup-team' element={<ProtectedRoute><TeamSetup/></ProtectedRoute>} />
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
                  <ProjectKanban />
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
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

// wrappers to get params (simplified)


const ChatWrapper = () => {
  const { user } = useAuth();
  return <ChatPage teamId={user?.teamId} currentUser={user} />; // Also pass currentUser prop
};


export default App;
