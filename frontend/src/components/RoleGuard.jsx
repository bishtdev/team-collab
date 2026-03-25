import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const RoleGuard = ({ roles = [], permission, children, fallback = null }) => {
  const { role, hasPermission } = usePermissions();

  // Check by permission action string
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check by role list
  if (roles.length > 0 && !roles.includes(role)) {
    return fallback;
  }

  return children;
};

export default RoleGuard;
