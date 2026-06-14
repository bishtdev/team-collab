import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../Modal';
import { createTeam } from '../../features/teams/teamsSlice';

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { isMutating, error } = useSelector(state => state.teams);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setLocalError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Team name is required');
      return;
    }

    try {
      await dispatch(createTeam({ name, description })).unwrap();
      onSuccess?.();
      onClose();
    } catch {
      // error handled by slice
    }
  };

  const displayError = localError || error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Team"
      subtitle="Create a team and invite members to collaborate"
      size="md"
    >
      {displayError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Team Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
            placeholder="e.g., Engineering Team"
            autoFocus
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
            placeholder="What does this team work on?"
            rows={3}
          />
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
            disabled={isMutating}
            className="px-5 py-2.5 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isMutating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Team</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTeamModal;
