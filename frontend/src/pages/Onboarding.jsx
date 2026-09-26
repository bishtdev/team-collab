// pages/Onboarding.jsx
// Shown when user has 0 orgs (new signup, no invite yet).
// Two doors, no org picker (prevents workers discovering Anil's company):
// - Door 1: Create workspace {company name} → POST /orgs → becomes OWNER.
// - Door 2: Have invite link? Paste token → navigate /invite/:token.
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createOrg } from '../features/orgs/orgsSlice';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { isMutating, error } = useSelector((s) => s.orgs);
  const [companyName, setCompanyName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [localError, setLocalError] = useState('');

  // Door 1: self-serve workspace creation. No script, no admin needed.
  // Backend creates Org + default General team + OWNER membership atomically.
  const handleCreate = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!companyName.trim()) {
      setLocalError('Company name required');
      return;
    }
    try {
      await dispatch(createOrg(companyName.trim())).unwrap();
      await refreshUser();
      toast.success('Workspace created', { description: `${companyName} is ready. Invite your team.` });
      navigate('/setup-team');
    } catch {
      // error in slice
    }
  };

  // Door 2: join via token (worker path — never creates, only joins).
  const handleJoin = (e) => {
    e.preventDefault();
    const token = inviteToken.trim().replace(/.*\/invite\//, ''); // accept full link or raw token
    if (!token) {
      setLocalError('Paste your invite link or token');
      return;
    }
    navigate(`/invite/${token}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="space-y-1.5">
        <h1 className="text-h2 font-semibold">Set up your workspace</h1>
        <p className="text-small text-muted-foreground">
          Create a new company workspace (you become owner), or join with an invite link.
        </p>
      </div>
      {(localError || error) && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-small text-destructive">
          {localError || error}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="gap-4 p-5">
          <h2 className="text-h3 font-semibold">Create workspace</h2>
          <p className="text-small text-muted-foreground">For company owners (Anil). You become OWNER.</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="onboard-company" className="mb-1.5">Company name</Label>
              <Input id="onboard-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc" />
            </div>
            <Button type="submit" loading={isMutating} className="w-full">Create workspace</Button>
          </form>
        </Card>
        <Card className="gap-4 p-5">
          <h2 className="text-h3 font-semibold">Join with invite</h2>
          <p className="text-small text-muted-foreground">For workers. Ask your admin for the link.</p>
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <Label htmlFor="onboard-token" className="mb-1.5">Invite link or token</Label>
              <Input id="onboard-token" value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} placeholder="https://…/invite/abc123" />
            </div>
            <Button type="submit" variant="secondary" className="w-full">Continue</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
