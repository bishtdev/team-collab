import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();
  const [modalData, setModalData] = useState(null); // { mode: 'create'|'edit', project: {...} }
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const canEdit = ['ADMIN', 'MANAGER'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

  const load = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

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
    if (!window.confirm('Delete project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Projects</h2>
        {canEdit && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New Project
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div key={p._id} className="p-4 border rounded bg-white dark:bg-gray-800 relative">
            <div className="font-bold text-lg">{p.name}</div>
            <div className="text-sm mb-2">{p.description}</div>
            <div className="flex gap-2 mt-2">
              <a
                href={`/project/${p._id}/kanban`}
                className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Open Kanban
              </a>
              {canEdit && (
                <button
                  onClick={() => openEdit(p)}
                  className="text-sm px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(p._id)}
                  className="text-sm px-2 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold mb-2">
              {modalData.mode === 'create' ? 'Create Project' : 'Edit Project'}
            </h3>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalData(null)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
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
