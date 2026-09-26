// pages/InviteAccept.jsx
// Public invite landing: /invite/:token (Door 2 — join, never create).
// Flow:
// 1. GET /invites/:token/validate -> show workspace + team, role, expiry.
// 2. Create an account OR sign in with the INVITED email (email locked) — or, if
//    already signed in as that email, accept directly.
// 3. POST /invites/:token/accept -> joins the workspace (+team) -> /projects.
// Why email locked: the token is bound to one email; another returns EMAIL_MISMATCH.
// This route is intentionally NOT wrapped in PublicRoute, so an already-signed-in
// user can accept a second invite instead of being bounced to /projects.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { useAuth } from '../context/AuthContext';
import { useOrgStatus } from '../hooks/useOrgStatus';
import * as teamService from '../services/teamService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { friendlyAuthError } from '@/lib/authErrors';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { firebaseUser, refreshUser, logout } = useAuth();
  const { refresh: refreshOrgs } = useOrgStatus();
  const [meta, setMeta] = useState(null); // {email, orgName, teamName, role, expiresAt}
  const [status, setStatus] = useState('loading'); // loading|ready|error
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup'); // signup|login
  const [busy, setBusy] = useState(false);

  // Step 1: validate the token on mount. Public endpoint, no auth needed.
  useEffect(() => {
    let cancelled = false;
    teamService
      .validateInvite(token)
      .then((res) => {
        if (!cancelled) {
          setMeta(res.data);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          setError(err.response?.data?.error || 'Invalid or expired invite.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Steps 2+3: authenticate (when needed) then accept. Refreshing the org list
  // and the user before navigating means the route guard already sees the new
  // membership instead of racing it.
  const accept = async () => {
    await teamService.acceptInvite(token, { name });
    refreshOrgs();
    await refreshUser();
    navigate('/projects', { replace: true });
  };

  const runAccept = async (authenticate) => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await authenticate();
      await accept();
    } catch (err) {
      setError(err.response?.data?.error || friendlyAuthError(err));
      setBusy(false); // only on failure — success navigates away
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = meta.email; // locked — never from user input
    runAccept(async () => {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    });
  };

  const handleSwitchAccount = async () => {
    setError('');
    await logout();
    setPassword('');
  };

  if (status === 'loading') return <p className="text-small text-muted-foreground">Validating invite…</p>;
  if (status === 'error') {
    return (
      <div className="space-y-3">
        <h1 className="text-h2 font-semibold">Invite not valid</h1>
        <p className="text-small text-destructive">{error}</p>
        <p className="text-small text-muted-foreground">Ask your admin for a new invite link.</p>
        <Link to="/login" className="text-small text-primary underline-offset-4 hover:underline">Back to sign in</Link>
      </div>
    );
  }

  // Mid-accept: signing in flips `firebaseUser`, so hold this panel steady
  // rather than letting the layout switch under the user.
  if (busy) {
    return (
      <div className="space-y-3">
        <h1 className="text-h2 font-semibold">Joining {meta.orgName || meta.teamName}…</h1>
        <p className="text-small text-muted-foreground">Setting up your access. One moment.</p>
      </div>
    );
  }

  const signedInEmail = firebaseUser?.email?.toLowerCase() || null;
  const inviteEmail = meta.email ? String(meta.email).toLowerCase() : null;
  const emailMatches = Boolean(signedInEmail && inviteEmail && signedInEmail === inviteEmail);

  // Signed in as someone else — the token is bound to the invitee's email.
  if (signedInEmail && !emailMatches) {
    return (
      <div className="space-y-3">
        <h1 className="text-h2 font-semibold">Wrong account</h1>
        <p className="text-small text-muted-foreground">
          This invite is for <span className="font-medium text-foreground">{meta.email}</span>, but
          you're signed in as <span className="font-medium text-foreground">{firebaseUser.email}</span>.
        </p>
        <Button type="button" variant="secondary" className="w-full" onClick={handleSwitchAccount}>
          Sign out and continue
        </Button>
        <Link to="/projects" className="block text-small text-primary underline-offset-4 hover:underline">
          Back to my workspace
        </Link>
      </div>
    );
  }

  // Already signed in as the invited email: accept without re-authenticating.
  if (emailMatches) {
    return (
      <div className="space-y-1.5">
        <h1 className="text-h2 font-semibold">Join {meta.orgName || meta.teamName}</h1>
        <p className="text-small text-muted-foreground">
          {meta.orgName && meta.teamName ? `${meta.orgName} / ${meta.teamName} · ` : ''}
          Invited as <span className="font-medium text-foreground">{meta.role}</span> · expires{' '}
          {new Date(meta.expiresAt).toLocaleString()}
        </p>
        <div className="mt-4 space-y-3">
          {error && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-small text-destructive">
              {error}
            </div>
          )}
          <Button className="w-full" onClick={() => runAccept(async () => {})}>
            Accept invite as {meta.email}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <h1 className="text-h2 font-semibold">Join {meta.orgName || meta.teamName}</h1>
      <p className="text-small text-muted-foreground">
        {meta.orgName && meta.teamName ? `${meta.orgName} / ${meta.teamName} · ` : ''}
        Invited as <span className="font-medium text-foreground">{meta.role}</span> · expires {new Date(meta.expiresAt).toLocaleString()}
      </p>
      <div className="mt-4 flex gap-1 rounded-md border border-border bg-surface p-1">
        <Button type="button" variant={mode === 'signup' ? 'secondary' : 'ghost'} size="sm" className="flex-1" onClick={() => setMode('signup')}>New account</Button>
        <Button type="button" variant={mode === 'login' ? 'secondary' : 'ghost'} size="sm" className="flex-1" onClick={() => setMode('login')}>Sign in</Button>
      </div>
      {error && <div role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-small text-destructive">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label>Email (locked to invite)</Label>
          <Input type="email" value={meta.email} disabled />
        </div>
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full name</Label>
            <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Avery Stone" required />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="invite-pass">{mode === 'signup' ? 'Create password' : 'Password'}</Label>
          <Input id="invite-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        </div>
        <Button type="submit" loading={busy} className="w-full">{mode === 'signup' ? 'Accept invite & create account' : 'Accept invite & sign in'}</Button>
      </form>
    </div>
  );
};

export default InviteAccept;
