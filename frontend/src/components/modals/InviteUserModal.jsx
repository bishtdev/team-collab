// components/modals/InviteUserModal.jsx
// Admin-only invite dialog (replaces AddUserToTeamModal direct-add).
// Flow: admin picks team (prop), enters email + role -> POST /invites ->
// shows copy-able link as fallback if email fails + lists pending invites w/ revoke.
// Why role limited to MEMBER/MANAGER: ADMIN granted only by OWNER via role-change.
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Modal from '../Modal';
import { createInvite, fetchInvites, revokeInvite } from '../../features/teams/teamsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InviteUserModal = ({ isOpen, onClose, team, onSuccess }) => {
  const dispatch = useDispatch();
  const { isMutating, error, invites, lastInviteLink } = useSelector((s) => s.teams);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [localError, setLocalError] = useState('');

  // Load pending invites each time modal opens for this team.
  useEffect(() => {
    if (isOpen && team?._id) {
      setEmail('');
      setRole('MEMBER');
      setLocalError('');
      dispatch(fetchInvites(team._id));
    }
  }, [isOpen, team?._id, dispatch]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    try {
      // Org-aware: send orgId when team carries it (new workspaces). Backend derives
      // org from team for legacy teams without orgId. teamId stays for team-level join.
      const res = await dispatch(createInvite({
        email: email.trim(), teamId: team._id, ...(team.orgId ? { orgId: team.orgId } : {}), role,
      })).unwrap();
      toast.success('Invite created', { description: res.inviteLink ? 'Copy the link as backup.' : email });
      dispatch(fetchInvites(team._id));
      setEmail('');
      onSuccess?.();
    } catch {
      // error in slice
    }
  };

  const handleRevoke = async (id) => {
    try {
      await dispatch(revokeInvite(id)).unwrap();
      toast.success('Invite revoked');
    } catch { /* slice error */ }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invite to ${team?.name || 'Team'}`} subtitle="Email invite link — expires in 48h, single-use" size="md">
      {(localError || error) && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">{localError || error}</div>
      )}
      {lastInviteLink && (
        <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-small">
          <p className="font-medium">Copy link (email backup):</p>
          <p className="mt-1 break-all text-muted-foreground">{lastInviteLink}</p>
        </div>
      )}
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <Label htmlFor="invite-email" className="mb-1.5">Email</Label>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" required />
        </div>
        <div>
          <Label className="mb-1.5">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Member — do assigned work</SelectItem>
              <SelectItem value="MANAGER">Manager — manage projects/tasks</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-micro text-muted-foreground">Admin role granted only by owner via Manage.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button type="submit" loading={isMutating}>{isMutating ? 'Sending…' : 'Send invite'}</Button>
        </div>
      </form>
      {invites.length > 0 && (
        <div className="mt-5">
          <Label className="mb-1.5">Pending invites ({invites.filter((i) => i.status === 'pending').length})</Label>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-2">
            {invites.map((inv) => (
              <div key={inv._id} className="flex items-center gap-2 px-2 py-1.5 text-small">
                <span className="truncate">{inv.email} · {inv.role} · {inv.status}</span>
                {inv.status === 'pending' && (
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => handleRevoke(inv._id)}>Revoke</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InviteUserModal;
