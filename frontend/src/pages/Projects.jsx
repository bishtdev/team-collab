// Projects.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiTrello, FiLoader } from 'react-icons/fi';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();
  const [modalData, setModalData] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canEdit = ['ADMIN', 'MANAGER'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

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
    setName('');
    setDescription('');
    setModalData({ mode: 'create' });
    setError('');
  };

  const openEdit = (project) => {
    setName(project.name);
    setDescription(project.description || '');
    setModalData({ mode: 'edit', project });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (modalData.mode === 'create') {
        await api.post('/projects', { name, description });
      } else {
        await api.put(`/projects/${modalData.project._id}`, { name, description });
      }
      setModalData(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
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

  return (
    <div className="container mx-auto px-4 py-6 transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in your team
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow hover:shadow-md transition-all duration-300 mt-4 md:mt-0"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <FiLoader className="animate-spin text-4xl text-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <FiTrello className="mx-auto text-5xl text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">No projects yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Get started by creating your first project
          </p>
          {canEdit && (
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow hover:shadow-md transition-all duration-300"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p._id}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">{p.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                    {p.description || 'No description'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 text-gray-500 hover:text-yellow-600 transition-colors duration-300"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-300"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <a
                  href={`/project/${p._id}/kanban`}
                  className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow transition-all duration-300"
                >
                  Open Kanban Board
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {modalData.mode === 'create' ? 'Create Project' : 'Edit Project'}
              </h3>
              <button
                onClick={() => setModalData(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm transition-all duration-300">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-300"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-300"
                  placeholder="Describe the project"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalData(null)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 shadow"
                >
                  {modalData.mode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;