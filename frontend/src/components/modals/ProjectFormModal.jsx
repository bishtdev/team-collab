import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Modal from '../Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createProject, updateProject, fetchTeamUsers } from '../../features/projects/projectsSlice';

const ProjectFormModal = ({ isOpen, onClose, mode = 'create', project = null }) => {
  const dispatch = useDispatch();
  const { teamMembers, isMutating, error } = useSelector(state => state.projects);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [localError, setLocalError] = useState('');

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
      setLocalError('');
      dispatch(fetchTeamUsers());
    }
  }, [isOpen, mode, project, dispatch]);

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
      setLocalError('Project name is required');
      return;
    }

    const payload = { name, description, assignedUsers: selectedUsers };

    try {
      if (mode === 'create') {
        await dispatch(createProject(payload)).unwrap();
        toast.success('Project created', { description: `${name} is ready.` });
      } else {
        await dispatch(updateProject({ id: project._id, data: payload })).unwrap();
        toast.success('Changes saved');
      }
      onClose();
    } catch (err) {
      setLocalError(
        typeof err === 'string' ? err : 'Could not save the project. Try again.'
      );
    }
  };

  const displayError = localError || error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Project' : 'Edit Project'}
      subtitle={mode === 'create' ? 'Start a new project for your team' : 'Update project details'}
      size="md"
    >
      {displayError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="project-form-name" className="mb-1.5">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="project-form-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Marketing Website Redesign"
          />
        </div>

        <div>
          <Label htmlFor="project-form-description" className="mb-1.5">
            Description
          </Label>
          <Textarea
            id="project-form-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            placeholder="What is this project about?"
            rows={3}
          />
        </div>

        <div>
          <Label className="mb-1.5">
            Assign Members
          </Label>
          {teamMembers.length === 0 ? (
            <div className="py-3 text-center text-small text-faint">No team members found</div>
          ) : (
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-2 scrollbar-thin">
              {teamMembers.map(member => (
                <label
                  key={member._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-small transition-colors duration-150 ease-kiln ${
                    selectedUsers.includes(member._id)
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(member._id)}
                    onChange={() => toggleUser(member._id)}
                    className="size-4 rounded-xs border-border accent-primary"
                  />
                  <span>{member.name}</span>
                  <span className="ml-auto text-micro text-faint">{member.email}</span>
                </label>
              ))}
            </div>
          )}
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
            {isMutating
              ? (mode === 'create' ? 'Creating…' : 'Saving…')
              : (mode === 'create' ? 'Create project' : 'Save changes')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
