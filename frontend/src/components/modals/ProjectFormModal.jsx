import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import api from '../../services/api';

const ProjectFormModal = ({ isOpen, onClose, mode = 'create', project = null, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        setName(project.name);
        setDescription(project.description || '');
        setSelectedUsers((project.assignedUsers || []).map(u => u._id));
      } else {
        setName('');
        setDescription('');
        setSelectedUsers([]);
      }
      setError('');
      loadTeamMembers();
    }
  }, [isOpen, mode, project]);

  const loadTeamMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await api.get('/users/team');
      setTeamMembers(res.data.members || []);
    } catch (err) {
      setTeamMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { name, description, assignedUsers: selectedUsers };

      if (mode === 'create') {
        await api.post('/projects', payload);
      } else {
        await api.put(`/projects/${project._id}`, payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Project' : 'Edit Project'}
      subtitle={mode === 'create' ? 'Start a new project for your team' : 'Update project details'}
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Project Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
            placeholder="e.g., Marketing Website Redesign"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm resize-none"
            placeholder="What is this project about?"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Assign Members
          </label>
          {isLoadingMembers ? (
            <div className="py-4 text-center text-gray-600 text-sm">Loading members...</div>
          ) : teamMembers.length === 0 ? (
            <div className="py-4 text-center text-gray-600 text-sm">No team members found</div>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1 border border-gray-800 rounded-xl p-2 bg-gray-800/30 scrollbar-thin">
              {teamMembers.map(member => (
                <label
                  key={member._id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                    selectedUsers.includes(member._id)
                      ? 'bg-gray-700/50 text-white'
                      : 'text-gray-400 hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(member._id)}
                    onChange={() => toggleUser(member._id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-white focus:ring-gray-600 focus:ring-offset-0 accent-white"
                  />
                  <span>{member.name}</span>
                  <span className="text-gray-600 text-xs ml-auto">{member.email}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-800 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                <span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
              </>
            ) : (
              <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
