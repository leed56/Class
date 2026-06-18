import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/core/auth/AuthProvider';
import { WorkspaceRole } from '@/lib/database.types';

import { can, Permission } from './permissions';
import { getCurrentWorkspaceRole } from './staffService';

export function useWorkspaceRole() {
  const { demoMode } = useAuth();
  const [role, setRole] = useState<WorkspaceRole | null>(demoMode ? 'owner' : null);
  const [isLoading, setIsLoading] = useState(!demoMode);

  const reload = useCallback(async () => {
    if (demoMode) {
      setRole('owner');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextRole = await getCurrentWorkspaceRole();
      setRole(nextRole);
    } finally {
      setIsLoading(false);
    }
  }, [demoMode]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const hasPermission = useCallback((permission: Permission) => can(role, permission), [role]);

  return { role, isLoading, reload, hasPermission };
}
