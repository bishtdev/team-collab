import React, { useState } from 'react';
import Modal from '../Modal';
import { changeMemberRole, removeMember, transferOwnership } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';
import { FiShield, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { toast } from 'sonner';

const ROLES = ['ADMIN', 'MANAGER', 'MEMBER'];

const ChangeRoleModal = ({ isOpen, onClose, team, members, onSuccess }) => {
  const { user } = useAuth();
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setMutating(true);
    try {
      await changeMemberRole(team._id, userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change role';
      setError(msg);
      toast.error(msg);
    } finally {
      setMutating(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    setError('');
    setMutating(true);
    try {
      await removeMember(team._id, userId);
      toast.success('Member removed');
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to remove member';
      setError(msg);
      toast.error(msg);
    } finally {
      setMutating(false);
    }
  };

  const handleTransfer = async (newAdminId) => {
    if (!window.confirm('Transfer team ownership? You will become a MANAGER.')) return;
    setError('');
    setMutating(true);
    try {
      await transferOwnership(team._id, newAdminId);
      toast.success('Ownership transferred');
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to transfer ownership';
      setError(msg);
      toast.error(msg);
    } finally {
      setMutating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Members"
      subtitle={`${team?.name || 'Team'} — ${members.length} member${members.length !== 1 ? 's' : ''}`}
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {members.map(member => {
          const isCurrentUser = member._id === user?._id;
          const isAdmin = member.role === 'ADMIN';
          const isTeamAdmin = team?.adminId === member._id;

          return (
            <div
              key={member._id}
              className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/50 rounded-xl border border-gray-800/50"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {member.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white truncate">{member.name}</span>
                  {isCurrentUser && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">You</span>
                  )}
                  {isTeamAdmin && (
                    <FiShield className="w-3 h-3 text-amber-400" title="Team Admin" />
                  )}
                </div>
                <span className="text-xs text-gray-500">{member.email}</span>
              </div>

              {/* Role selector */}
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member._id, e.target.value)}
                disabled={mutating || isCurrentUser}
                className="text-xs bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Remove button */}
              {!isCurrentUser && !isAdmin && (
                <button
                  onClick={() => handleRemove(member._id)}
                  disabled={mutating}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Remove member"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}

              {/* Transfer ownership */}
              {!isCurrentUser && !isAdmin && (
                <button
                  onClick={() => handleTransfer(member._id)}
                  disabled={mutating}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                  title="Transfer ownership"
                >
                  <FiUserCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <p className="text-center text-gray-600 py-4">No members found</p>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-800 rounded-xl text-gray-400 hover:bg-gray-800 transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ChangeRoleModal;
