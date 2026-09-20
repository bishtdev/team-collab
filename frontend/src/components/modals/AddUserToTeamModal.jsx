import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Modal from '../Modal';
import { addUserToTeam } from '../../features/teams/teamsSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/product/UserAvatar';

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
      toast.success('Member added');
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
      title={`Add user to ${team?.name || 'Team'}`}
      subtitle="Add an existing user or create a new one"
      size="md"
    >
      {displayError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {displayError}
        </div>
      )}

      <div className="mb-4 flex gap-1 rounded-md border border-border bg-surface p-1">
        <Button
          type="button"
          variant={mode === 'existing' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => { setMode('existing'); setLocalError(''); }}
          className="flex-1"
        >
          Existing user
        </Button>
        <Button
          type="button"
          variant={mode === 'new' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => { setMode('new'); setLocalError(''); }}
          className="flex-1"
        >
          New user
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'existing' ? (
          <div>
            <Label htmlFor="add-user-select" className="mb-1.5">Select user</Label>
            {availableUsers.length === 0 ? (
              <p className="py-3 text-center text-small text-faint">All users are already in this team</p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="add-user-select" className="w-full">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email}) — {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="add-user-name" className="mb-1.5">Name</Label>
              <Input
                id="add-user-name"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter user name"
              />
            </div>
            <div>
              <Label htmlFor="add-user-email" className="mb-1.5">Email</Label>
              <Input
                id="add-user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </>
        )}

        {teamMembers.length > 0 && (
          <div>
            <Label className="mb-1.5">Current members ({teamMembers.length})</Label>
            <div className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border border-border bg-surface p-2 scrollbar-thin">
              {teamMembers.map(member => (
                <div key={member._id} className="flex items-center gap-2 px-2 py-1.5">
                  <UserAvatar name={member.name} size="sm" />
                  <span className="truncate text-small text-foreground">{member.name}</span>
                  <Badge variant="outline" className="ml-auto">{member.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isMutating}
            disabled={isMutating || (mode === 'existing' && availableUsers.length === 0)}
          >
            {isMutating ? 'Adding…' : 'Add user'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserToTeamModal;
