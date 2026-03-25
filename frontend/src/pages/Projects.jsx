import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import ProjectFormModal from '../components/modals/ProjectFormModal';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiFolder, FiLoader, FiUsers } from 'react-icons/fi';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();
  const { canCreateProject, canEditProject, canDeleteProject } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProject, setEditingProject] = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.teamId) load();
  }, [user?.teamId]);

  const openCreate = () => {
    setModalMode('create');
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setModalMode('edit');
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-amber-500/10 text-amber-400';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in your team
          </p>
        </div>
        {canCreateProject && (
          <button
            id="new-project-btn"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all mt-4 md:mt-0 text-sm shadow-lg shadow-white/5"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <FiLoader className="animate-spin text-3xl text-gray-600" />
            <span className="text-sm text-gray-600">Loading projects...</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
            <FiFolder className="text-2xl text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">No projects yet</h3>
          <p className="text-gray-600 mt-2 text-sm max-w-md mx-auto">
            Get started by creating your first project to organize tasks and collaborate with your team
          </p>
          {canCreateProject && (
            <button
              onClick={openCreate}
              className="mt-6 px-5 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all text-sm"
            >
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p._id}
              className="p-5 bg-gray-900/60 rounded-2xl border border-gray-800/60 hover:border-gray-700/60 transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{p.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {p.description || 'No description'}
                  </p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  {canEditProject && (
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDeleteProject && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned users */}
              {p.assignedUsers && p.assignedUsers.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {p.assignedUsers.slice(0, 4).map(u => (
                      <div
                        key={u._id}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white border-2 border-gray-900"
                        title={u.name}
                      >
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                    ))}
                    {p.assignedUsers.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-medium text-gray-400 border-2 border-gray-900">
                        +{p.assignedUsers.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">
                    {p.assignedUsers.length} member{p.assignedUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <Link
                to={`/project/${p._id}/kanban`}
                className="block w-full text-center px-4 py-2.5 bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all text-sm font-medium"
              >
                Open Kanban Board
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <ProjectFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        project={editingProject}
        onSuccess={load}
      />
    </div>
  );
};

export default Projects;
