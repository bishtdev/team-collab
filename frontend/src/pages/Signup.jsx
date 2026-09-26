import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { friendlyAuthError } from '@/lib/authErrors';

// Invite-only note: backend is the real gate (403 INVITE_REQUIRED).
// Owner emails in ADMIN_EMAILS bypass it, so the owner CAN still sign up here
// to set their Firebase password. The script only creates the Mongo row —
// Firebase holds the password, so first-time owner must sign up once with the
// exact owner email. Regular users without invites get rejected by backend.
const INVITE_ONLY = import.meta.env.VITE_INVITE_ONLY === 'true';

const Signup = () => {
  const { signup, lastSyncError } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password);
      // signup() syncs via /auth/sync — if INVITE_ONLY and no invite, backend
      // returns 403 INVITE_REQUIRED and AuthContext sets lastSyncError.
      if (lastSyncError?.code === 'INVITE_REQUIRED') {
        setError('Invite required. Ask your admin for an invite link.');
        return;
      }
      toast.success('Welcome to Kiln', {
        description: 'Account ready. Create a workspace (you become owner) or join via invite.',
      });
      // New multi-org flow: 0 orgs → /onboarding (Door 1 create vs Door 2 join).
      // /setup-team is legacy team-only and leaves you as MEMBER with no org.
      navigate('/onboarding');
    } catch (err) {
      // Firebase error OR backend INVITE_REQUIRED surfaced via response.
      const backendMsg = err.response?.data?.code === 'INVITE_REQUIRED'
        ? 'Invite required. Ask your admin for an invite link.'
        : null;
      setError(backendMsg || friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-h2 font-semibold text-foreground">
          Create your account
        </h1>
        <p className="text-small text-muted-foreground">
          {INVITE_ONLY
            ? 'Invite-only workspace. Owners can sign up directly; everyone else needs an invite link.'
            : 'Join your team and start collaborating.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-small text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Avery Stone"
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-faint transition-colors duration-150 ease-kiln hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.75} />
              ) : (
                <Eye className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          <p className="text-micro text-muted-foreground">
            Must be at least 6 characters.
          </p>
        </div>

        <Button id="signup-submit" type="submit" loading={isLoading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-small text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </>
  );
};

export default Signup;
