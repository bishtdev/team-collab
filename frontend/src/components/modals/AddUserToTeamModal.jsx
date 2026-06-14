import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../Modal';
import { addUserToTeam } from '../../features/teams/teamsSlice';

const AddUserToTeamModal = ({ isOpen, onClose, team, allUsers = [], teamMembers = [], onSuccess }) => {
  const dispatch = useDispatch();
  const { isMutating, error } = useSelector(state => state.teams);

  const [mode, setMode] = useState('existing');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode('existing');
      setSelectedUserId('');
      setNewUserName('');
      setNewUserEmail('');
      setLocalError('');
    }
  }, [isOpen]);

  const availableUsers = allUsers.filter(
    u => !teamMembers.some(m => m._id === u._id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'existing' && !selectedUserId) {
      setLocalError('Please select a user');
      return;
    }
    if (mode === 'new' && (!newUserName.trim() || !newUserEmail.trim())) {
      setLocalError('Please fill in all fields');
      return;
    }

    const payload = mode === 'existing'
      ? { userId: selectedUserId }
      : { email: newUserEmail, name: newUserName };

    try {
      await dispatch(addUserToTeam({ teamId: team._id, data: payload })).unwrap();
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
      title={`Add User to ${team?.name || 'Team'}`}
      subtitle="Add an existing user or create a new one"
      size="md"
    >
      {displayError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {displayError}
        </div>
      )}

      <div className="flex p-1 bg-gray-800/60 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => { setMode('existing'); setLocalError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'existing'
              ? 'bg-gray-700 text-white shadow'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Existing User
        </button>
        <button
          type="button"
          onClick={() => { setMode('new'); setLocalError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'new'
              ? 'bg-gray-700 text-white shadow'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          New User
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'existing' ? (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Select User</label>
            {availableUsers.length === 0 ? (
              <p className="text-sm text-gray-600 py-3 text-center">All users are already in this team</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
              >
                <option value="">Choose a user...</option>
                {availableUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email}) — {user.role}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Name</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
                placeholder="Enter user name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-800/50 text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:outline-none transition-colors text-sm"
                placeholder="Enter email address"
              />
            </div>
          </>
        )}

        {teamMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Current Members ({teamMembers.length})
            </label>
            <div className="max-h-28 overflow-y-auto border border-gray-800 rounded-xl p-2 bg-gray-800/30 space-y-0.5 scrollbar-thin">
              {teamMembers.map(member => (
                <div key={member._id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
                    {member.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-gray-300 truncate">{member.name}</span>
                  <span className="text-gray-600 text-xs ml-auto">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
            disabled={isMutating || (mode === 'existing' && availableUsers.length === 0)}
            className="px-5 py-2.5 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isMutating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <span>Add User</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserToTeamModal;
