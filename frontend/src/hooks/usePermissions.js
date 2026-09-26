import { useAuth } from '../context/AuthContext';
import { useOrgStatus } from './useOrgStatus';

// Permissions map — maps role to allowed actions.
// OWNER is superset of ADMIN (passes every check). MANAGER manages work,
// not people (no invite/remove/role-change). MEMBER contributes only.
const ROLE_PERMISSIONS = {
  OWNER: [
    'create:project',
    'edit:project',
    'delete:project',
    'create:team',
    'manage:team',
    'add:team-member',
    'invite:user',
    'assign:role',
    'create:task',
    'edit:task',
    'delete:task',
  ],
  ADMIN: [
    'create:project',
    'edit:project',
    'delete:project',
    'create:team',
    'manage:team',
    'add:team-member',
    'invite:user',
    'assign:role',
    'create:task',
    'edit:task',
    'delete:task',
  ],
  MANAGER: [
    'create:project',
    'edit:project',
    'create:task',
    'edit:task',
    'delete:task',
  ],
  MEMBER: [
    // Read-only for tasks: members can comment, manage subtasks, view board
  ],
};

// Empty permissions for safety when user is not loaded yet
const EMPTY_PERMISSIONS = [];

const emptyReturn = {
  role: null,
  orgRole: null,
  activeOrg: null,
  activeOrgId: null,
  permissions: EMPTY_PERMISSIONS,
  hasPermission: () => false,
  isOwner: false,
  isAdmin: false,
  canCreateProject: false,
  canEditProject: false,
  canDeleteProject: false,
  canManageTeam: false,
  canAddTeamMember: false,
  canInvite: false,
  canAssignRole: false,
  canCreateTeam: false,
  canCreateTask: false,
  canEditTask: false,
  canDeleteTask: false,
};

export const usePermissions = () => {
  const { user } = useAuth();
  // Loads my workspaces once per signed-in account. Guarded inside the hook so a
  // user with zero orgs does not trigger an endless refetch.
  const { orgs, activeOrgId, status } = useOrgStatus();

  // Graceful fallback: null user → empty permissions (not MEMBER).
  // This prevents flash of privileged UI during initial auth check.
  if (!user) return emptyReturn;

  // Resolve active org: explicit selection wins, else backend pointer,
  // else first org (matches orgsSlice auto-pick).
  const resolvedOrgId = activeOrgId || user.lastActiveOrgId || orgs[0]?._id || null;
  const activeOrg = orgs.find((o) => String(o._id) === String(resolvedOrgId)) || null;

  // Until the org list settles we can't know the role → deny affordances (fail closed).
  if (status === 'idle' || status === 'loading') {
    return { ...emptyReturn, activeOrg, activeOrgId: resolvedOrgId };
  }

  // PRIMARY: role from active-org membership (myRole set by GET /api/orgs).
  // FALLBACK: legacy user.role cache for pre-migration rows without an org.
  // Backend always re-checks Org.members, so a stale fallback here can only
  // show/hide buttons, never grant access.
  const role = activeOrg?.myRole || user.role || 'MEMBER';
  const roleSource = activeOrg?.myRole ? 'org' : 'legacy-fallback';

  const permissions = ROLE_PERMISSIONS[role] || [];
  const hasPermission = (action) => permissions.includes(action);

  return {
    role, // effective role (org truth preferred)
    orgRole: activeOrg?.myRole || null,
    roleSource, // 'org' | 'legacy-fallback' | 'none' — useful in devtools
    activeOrg,
    activeOrgId: resolvedOrgId,
    permissions,
    hasPermission,
    // Strict: only OWNER. Use isAdmin (OWNER|ADMIN) for people-management UI.
    isOwner: role === 'OWNER',
    isAdmin: role === 'OWNER' || role === 'ADMIN',
    canCreateProject: hasPermission('create:project'),
    canEditProject: hasPermission('edit:project'),
    canDeleteProject: hasPermission('delete:project'),
    canManageTeam: hasPermission('manage:team'),
    canAddTeamMember: hasPermission('add:team-member'),
    canInvite: hasPermission('invite:user'),
    canAssignRole: hasPermission('assign:role'),
    canCreateTeam: hasPermission('create:team'),
    canCreateTask: hasPermission('create:task'),
    canEditTask: hasPermission('edit:task'),
    canDeleteTask: hasPermission('delete:task'),
  };
};
