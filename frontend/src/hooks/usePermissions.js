import { useAuth } from '../context/AuthContext';

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
    'create:task',
    'edit:task',
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || 'MEMBER';
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.MEMBER;

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
