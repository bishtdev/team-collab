import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAuth } from '../context/AuthContext';
import { fetchOrgs } from '../features/orgs/orgsSlice';

const FALLBACK = { items: [], activeOrgId: null, status: 'idle', isLoading: false, error: null };

// Loads the signed-in user's workspaces exactly once and reports progress.
// The `status === 'idle'` guard is what prevents the previous refetch loop:
// a user who belongs to zero orgs resolves to 'succeeded' (not back to
// 'idle'), so the effect stops firing. Re-entry is explicit via refresh().
export const useOrgStatus = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { items, activeOrgId, status, isLoading, error } = useSelector((s) => s.orgs || FALLBACK);

  useEffect(() => {
    if (user && status === 'idle') dispatch(fetchOrgs());
  }, [user, status, dispatch]);

  const refresh = useCallback(() => dispatch(fetchOrgs()), [dispatch]);

  return {
    orgs: items,
    activeOrgId,
    status, // idle | loading | succeeded | failed
    isLoading,
    error,
    orgCount: items.length,
    refresh,
  };
};
