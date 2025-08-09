// src/pages/Projects.js  (or Projects.jsx)
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

  // NEW: team members & selected assigned users
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user IDs

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

  // New: load team members (for dropdown)
  const loadTeamMembers = async () => {
    console.log('🔍 Loading team members...');
    console.log('👤 Current user:', user);
    console.log('🏢 User teamId:', user?.teamId);
    
    try {
      console.log('📡 Making API call to /users/team');
      const res = await api.get('/users/team');
      console.log('✅ API Response:', res);
      console.log('📊 Response data:', res.data);
      console.log('👥 Members array:', res.data.members);
      
      setTeamMembers(res.data.members || []);
      console.log('💾 Team members set to state:', res.data.members || []);
    } catch (err) {
      console.error('❌ Failed to load team members', err);
      console.error('📋 Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setTeamMembers([]);
    }
  };

  const openCreate = async () => {
    setName('');
    setDescription('');
    setModalData({ mode: 'create' });
    setError('');
    setSelectedUsers([]);
    await loadTeamMembers();
  };

  const openEdit = async (project) => {
    setName(project.name);
    setDescription(project.description || '');
    setModalData({ mode: 'edit', project });
    setError('');
    // prefill selectedUsers from project.assignedUsers (populated from backend)
    setSelectedUsers((project.assignedUsers || []).map(u => u._id || u._id));
    await loadTeamMembers();
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        assignedUsers: selectedUsers // send array of user ids
      };

      if (modalData.mode === 'create') {
        await api.post('/projects', payload);
      } else {
        await api.put(`/projects/${modalData.project._id}`, payload);
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

  // helper for multi-select change
  const onSelectedUsersChange = (e) => {
    // if using <select multiple>
    const options = Array.from(e.target.selectedOptions);
    setSelectedUsers(options.map(o => o.value));
  };

  return (
    <div className="container mx-auto px-4 py-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
        <p className="text-gray-400 mt-1">
          {projects.length} project{projects.length !== 1 ? 's' : ''} in your team
        </p>
      </div>
      {canEdit && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-200 rounded-lg border border-gray-700 transition-all mt-4 md:mt-0"
        >
          <FiPlus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      )}
    </div>
  
    {isLoading ? (
      <div className="flex justify-center py-12">
        <FiLoader className="animate-spin text-4xl text-gray-400" />
      </div>
    ) : projects.length === 0 ? (
      <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
        <FiTrello className="mx-auto text-5xl text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-gray-300">No projects yet</h3>
        <p className="text-gray-500 mt-2">
          Get started by creating your first project
        </p>
        {canEdit && (
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-white text-gray-900 hover:bg-gray-200 rounded-lg border border-gray-700 transition-all"
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
            className="p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                  {p.description || 'No description'}
                </p>
  
                {/* Show assigned users if any */}
                {p.assignedUsers && p.assignedUsers.length > 0 && (
                  <div className="mt-3 text-sm text-gray-300">
                    <strong>Assigned:</strong>{' '}
                    {p.assignedUsers.map(u => u.name).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && (
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-6">
              <a
                href={`/project/${p._id}/kanban`}
                className="block w-full text-center px-4 py-2 bg-white text-gray-900 hover:bg-gray-200 rounded-lg border border-gray-700 transition-all"
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
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              {modalData.mode === 'create' ? 'Create Project' : 'Edit Project'}
            </h3>
            <button
              onClick={() => setModalData(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-gray-800 border border-gray-700 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-700 focus:border-gray-600 bg-gray-800 text-white transition"
                placeholder="Project name"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-700 focus:border-gray-600 bg-gray-800 text-white transition"
                placeholder="Describe the project"
                rows={3}
              />
            </div>
  
            {/* multi-select for assigning users */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Assign Users
              </label>
              <select
                multiple
                value={selectedUsers}
                onChange={onSelectedUsersChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white"
                style={{ minHeight: 120 }}
              >
                {teamMembers.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
  
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
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
