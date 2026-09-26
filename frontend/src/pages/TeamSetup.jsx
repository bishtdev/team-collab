import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { fetchTeams, fetchTeamMembers, setActiveTeam, clearError } from '../features/teams/teamsSlice';
import CreateTeamModal from '../components/modals/CreateTeamModal';
import InviteUserModal from '../components/modals/InviteUserModal';
import ChangeRoleModal from '../components/modals/ChangeRoleModal';
import { ArrowRight, Briefcase, Plus, Settings, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/product/EmptyState';
import { PageHeader } from '@/components/product/PageHeader';
import { UserAvatar } from '@/components/product/UserAvatar';
import { cn } from '@/lib/utils';

const memberName = (member) => {
  const user = member?.userId;
  if (user && typeof user === 'object') {
    return user.name || user.email || 'Unknown member';
  }
  return member?.name || 'Unknown member';
};

const memberKey = (member, index) => {
  const user = member?.userId;
  if (user && typeof user === 'object') {
    return user._id || user.email || index;
  }
  if (typeof user === 'string') return user;
  return member?._id || index;
};

const TeamSetup = () => {
  const dispatch = useDispatch();
  const { user, refreshUser } = useAuth();
  // canInvite/canAssignRole = OWNER|ADMIN (manage people); canCreateTeam mirrors
  // the server-side workspace role check.
  const { canAssignRole, canInvite, canCreateTeam } = usePermissions();
  const navigate = useNavigate();
  const { items: teams, currentMembers, isLoading, isMutating, error } = useSelector(state => state.teams);
  // Active workspace: teams are scoped to it. ProtectedRoute guarantees ≥1 org here.
  const { items: orgs, activeOrgId } = useSelector(state => state.orgs || { items: [], activeOrgId: null });
  const resolvedOrgId = activeOrgId || user?.lastActiveOrgId || orgs[0]?._id || null;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Teams scoped to the active workspace (never the unscoped legacy listing).
  useEffect(() => {
    if (user && resolvedOrgId) dispatch(fetchTeams(resolvedOrgId));
  }, [user, resolvedOrgId, dispatch]);

  const openAddUserModal = async (team) => {
    setSelectedTeam(team);
    dispatch(clearError());
    dispatch(fetchTeamMembers(team._id));
    setShowAddUserModal(true);
  };

  const openRoleModal = async (team) => {
    setSelectedTeam(team);
    dispatch(clearError());
    dispatch(fetchTeamMembers(team._id));
    setShowRoleModal(true);
  };

  const handleSetActive = async (teamId) => {
    try {
      await dispatch(setActiveTeam(teamId)).unwrap();
      await dispatch(fetchTeams(resolvedOrgId));
      await refreshUser();
      navigate('/projects');
    } catch (err) {
      toast.error('Could not switch teams', {
        description:
          typeof err === 'string' ? err : 'Check your connection and try again.',
      });
    }
  };

  const handleCreateSuccess = () => {
    dispatch(fetchTeams(resolvedOrgId));
  };

  const handleAddUserSuccess = () => {
    if (selectedTeam) {
      dispatch(fetchTeamMembers(selectedTeam._id));
    }
    dispatch(fetchTeams(resolvedOrgId));
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-8xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Teams"
        description={`${teams.length} team${teams.length !== 1 ? 's' : ''}`}
      >
        {/* Server enforces the workspace role check; the UI just hides the action */}
        {canCreateTeam && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="size-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">New team</span>
          </Button>
        )}
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="gap-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-2/3" />
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No teams yet"
          description="Create your first team to start collaborating."
        >
          <Button onClick={() => setShowCreateModal(true)}>Create your first team</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {teams.map((t) => (
            <Card
              key={t._id}
              className={cn(
                'gap-4 p-5 transition-colors duration-200 ease-kiln',
                user?.teamId === t._id
                  ? 'border-primary/40 ring-1 ring-primary/20'
                  : 'hover:border-primary/40'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-h3 font-semibold text-foreground">{t.name}</h3>
                    {user?.teamId === t._id && (
                      <Badge variant="moss">Active</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-small text-muted-foreground">{t.description || 'No description'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {(t.members || []).filter(Boolean).slice(0, 5).map((m, i) => (
                    <UserAvatar
                      key={memberKey(m, i)}
                      name={memberName(m)}
                      size="sm"
                      className="ring-2 ring-surface"
                    />
                  ))}
                </div>
                <span className="text-micro text-muted-foreground tabular-nums">
                  {t.members ? t.members.length : 0} member{(t.members?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Invite-only: MANAGERs no longer see invite (they manage work, not people) */}
                {canInvite && (
                  <Button variant="secondary" size="sm" onClick={() => openAddUserModal(t)}>
                    <UserPlus className="size-4" strokeWidth={1.75} />
                    <span>Invite</span>
                  </Button>
                )}
                {canAssignRole && (
                  <Button variant="secondary" size="sm" onClick={() => openRoleModal(t)}>
                    <Settings className="size-4" strokeWidth={1.75} />
                    <span>Manage</span>
                  </Button>
                )}
                {user?.teamId !== t._id && (
                  <Button size="sm" onClick={() => handleSetActive(t._id)} disabled={isMutating}>
                    <span>Set active</span>
                    <ArrowRight className="size-4" strokeWidth={1.75} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                  View projects
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Invite modal replaces direct AddUser modal (invite link, 48h, single-use) */}
      <InviteUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        team={selectedTeam}
        onSuccess={handleAddUserSuccess}
      />

      <ChangeRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        team={selectedTeam}
        members={currentMembers}
        onSuccess={() => {
          if (selectedTeam) {
            dispatch(fetchTeamMembers(selectedTeam._id));
            dispatch(fetchTeams(resolvedOrgId));
          }
        }}
      />
    </div>
  );
};

export default TeamSetup;
