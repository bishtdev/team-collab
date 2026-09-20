import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { fetchTeams, fetchAllUsers, fetchTeamMembers, setActiveTeam, clearError } from '../features/teams/teamsSlice';
import * as teamService from '../services/teamService';
import CreateTeamModal from '../components/modals/CreateTeamModal';
import AddUserToTeamModal from '../components/modals/AddUserToTeamModal';
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
  const { canAssignRole } = usePermissions();
  const navigate = useNavigate();
  const { items: teams, allUsers, currentMembers, isLoading, isMutating, error } = useSelector(state => state.teams);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersRefresh, setMembersRefresh] = useState(0);

  const activeTeam = teams.find((t) => t._id === user?.teamId) || teams[0] || null;

  useEffect(() => {
    if (!activeTeam?._id) {
      setActiveMembers([]);
      return undefined;
    }
    let cancelled = false;
    setMembersLoading(true);
    teamService
      .fetchTeamMembers(activeTeam._id)
      .then((res) => {
        if (!cancelled) setActiveMembers(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setActiveMembers([]);
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTeam?._id, membersRefresh]);

  useEffect(() => {
    if (user) {
      dispatch(fetchTeams());
      dispatch(fetchAllUsers());
    }
  }, [user, dispatch]);

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
      await dispatch(fetchTeams());
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
    dispatch(fetchTeams());
    dispatch(fetchAllUsers());
    setMembersRefresh((v) => v + 1);
  };

  const handleAddUserSuccess = () => {
    if (selectedTeam) {
      dispatch(fetchTeamMembers(selectedTeam._id));
    }
    dispatch(fetchTeams());
    dispatch(fetchAllUsers());
    setMembersRefresh((v) => v + 1);
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
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="size-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">New team</span>
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {error}
        </div>
      )}

      {/* {activeTeam && !isLoading && (
        <Card className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-h3 font-semibold text-foreground">
              Members
              <span className="ml-2 text-small font-normal text-muted-foreground">
                {activeTeam.name}
              </span>
            </h2>
            <span className="text-micro text-faint tabular-nums">
              {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {membersLoading ? (
            <div className="space-y-3 py-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : activeMembers.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No members yet. Add the first person.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activeMembers.map((member) => (
                <li key={member._id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={member.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium text-foreground">
                      {member.name}
                      {member._id === user?._id && (
                        <span className="ml-2 text-micro text-faint">You</span>
                      )}
                    </p>
                    <p className="truncate text-micro text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <Badge
                    variant={
                      member.role === 'ADMIN'
                        ? 'gilt'
                        : member.role === 'MANAGER'
                          ? 'teal'
                          : 'outline'
                    }
                    className="capitalize"
                  >
                    {member.role?.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )} */}

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
                {canAssignRole && (
                  <Button variant="secondary" size="sm" onClick={() => openAddUserModal(t)}>
                    <UserPlus className="size-4" strokeWidth={1.75} />
                    <span>Add user</span>
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

      <AddUserToTeamModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        team={selectedTeam}
        allUsers={allUsers}
        teamMembers={currentMembers}
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
            dispatch(fetchTeams());
          }
          setMembersRefresh((v) => v + 1);
        }}
      />
    </div>
  );
};

export default TeamSetup;
