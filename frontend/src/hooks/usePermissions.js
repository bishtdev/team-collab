import { useAuth } from '../context/AuthContext';

// Permissions map — maps role to allowed actions.
// MEMBER permission set matches backend: no create:task or edit:task.
// Subtasks, comments, and activities are open to all members.
const ROLE_PERMISSIONS = {
  ADMIN: [
    'create:project',
    'edit:project',
    'delete:project',
    'create:team',
    'manage:team',
    'add:team-member',
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

export const usePermissions = () => {
  const { user } = useAuth();

  // Graceful fallback: null user → empty permissions (not MEMBER)
  // This prevents flash of privileged UI during initial auth check
  if (!user) {
    return {
      role: null,
      permissions: EMPTY_PERMISSIONS,
      hasPermission: () => false,
      canCreateProject: false,
      canEditProject: false,
      canDeleteProject: false,
      canManageTeam: false,
      canAddTeamMember: false,
      canAssignRole: false,
      canCreateTask: false,
      canEditTask: false,
      canDeleteTask: false,
    };
  }

  // Derive role from user.role (backward compat during migration)
  // After Phase 2, this comes from the active team's membership.
  const role = user.role || 'MEMBER';
  const permissions = ROLE_PERMISSIONS[role] || [];

  const hasPermission = (action) => permissions.includes(action);

  return {
    role,
    permissions,
    hasPermission,
    canCreateProject: hasPermission('create:project'),
    canEditProject: hasPermission('edit:project'),
    canDeleteProject: hasPermission('delete:project'),
    canManageTeam: hasPermission('manage:team'),
    canAddTeamMember: hasPermission('add:team-member'),
    canAssignRole: hasPermission('assign:role'),
    canCreateTask: hasPermission('create:task'),
    canEditTask: hasPermission('edit:task'),
    canDeleteTask: hasPermission('delete:task'),
  };
};
