import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Modal from '../Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTeam } from '../../features/teams/teamsSlice';

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { isMutating, error } = useSelector(state => state.teams);
  // Active workspace (org truth). Teams must belong to an org for isolation;
  // without orgId the team is orphan and your role shows as MEMBER.
  const { items: orgs, activeOrgId } = useSelector(state => state.orgs || { items: [], activeOrgId: null });

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
      // Org-aware: attach active workspace so team lands inside your org (isolation).
      const resolvedOrgId = activeOrgId || orgs[0]?._id || null;
      await dispatch(createTeam({ name, description, ...(resolvedOrgId ? { orgId: resolvedOrgId } : {}) })).unwrap();
      toast.success('Team created', { description: `${name} is ready.` });
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
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="create-team-name" className="mb-1.5">
            Team Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="create-team-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Engineering Team"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="create-team-description" className="mb-1.5">
            Description
          </Label>
          <Textarea
            id="create-team-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            placeholder="What does this team work on?"
            rows={3}
          />
        </div>

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
            disabled={isMutating}
          >
            {isMutating ? 'Creating…' : 'Create team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTeamModal;
