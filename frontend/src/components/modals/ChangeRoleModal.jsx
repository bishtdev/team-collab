import React, { useState } from 'react';
import Modal from '../Modal';
import { changeMemberRole, removeMember, transferOwnership } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';
import { Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/product/EmptyState';
import { UserAvatar } from '@/components/product/UserAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ROLES = ['ADMIN', 'MANAGER', 'MEMBER'];

const ChangeRoleModal = ({ isOpen, onClose, team, members, onSuccess }) => {
  const { user } = useAuth();
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

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

  const handleConfirm = () => {
    if (!pendingAction) return;
    const { type, userId } = pendingAction;
    setPendingAction(null);
    if (type === 'remove') handleRemove(userId);
    else if (type === 'transfer') handleTransfer(userId);
  };

  const pendingMember = members.find(m => m._id === pendingAction?.userId);
  const pendingName = pendingMember?.name || 'This member';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage members"
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''} on ${team?.name || 'Team'}`}
        size="lg"
      >
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
            {error}
          </div>
        )}

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {members.map(member => {
            const isCurrentUser = member._id === user?._id;
            const isAdmin = member.role === 'ADMIN';
            const isTeamAdmin = team?.adminId === member._id;

            return (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
              >
                <UserAvatar name={member.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-small font-medium text-foreground">{member.name}</span>
                    {isCurrentUser && (
                      <Badge variant="secondary">You</Badge>
                    )}
                    {isTeamAdmin && (
                      <span title="Team admin" className="inline-flex">
                        <Shield className="size-3.5 text-highlight" strokeWidth={1.75} />
                      </span>
                    )}
                  </div>
                  <span className="text-micro text-faint">{member.email}</span>
                </div>

                {/* Role selector */}
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member._id, e.target.value)}
                  disabled={mutating || isCurrentUser}
                  aria-label={`Role for ${member.name}`}
                  className="h-8 rounded-md border border-input bg-input px-2 text-small text-foreground transition-[border-color,box-shadow] duration-150 ease-kiln outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                {/* Remove button */}
                {!isCurrentUser && !isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingAction({ type: 'remove', userId: member._id })}
                    disabled={mutating}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remove member"
                    aria-label="Remove member"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </Button>
                )}

                {/* Transfer ownership */}
                {!isCurrentUser && !isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingAction({ type: 'transfer', userId: member._id })}
                    disabled={mutating}
                    className="text-muted-foreground hover:bg-highlight/10 hover:text-highlight"
                    title="Transfer ownership"
                    aria-label="Transfer ownership"
                  >
                    <UserCheck className="size-4" strokeWidth={1.75} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {members.length === 0 && (
          <EmptyState
            icon={Users}
            title="No members found"
            description="Invite teammates from the team page to start collaborating."
            className="py-8"
          />
        )}

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === 'transfer' ? 'Transfer ownership?' : 'Remove member?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'transfer'
                ? `You will become a manager and ${pendingName} will become the team admin.`
                : `${pendingName} will lose access to ${team?.name || 'this team'}. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={pendingAction?.type === 'remove' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              {pendingAction?.type === 'transfer' ? 'Transfer ownership' : 'Remove member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChangeRoleModal;
