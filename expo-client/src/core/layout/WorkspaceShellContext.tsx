import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { getCurrentWorkspace } from '@/features/auth/authService';
import { InstituteType } from '@/lib/database.types';

import { isDesktopWidth } from './breakpoints';

type WorkspaceShellContextValue = {
  instituteType: InstituteType;
  academySector: string | null;
  workspaceName: string | null;
  isDesktop: boolean;
  useDesktopShell: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | null>(null);

export function WorkspaceShellProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const [instituteType, setInstituteType] = useState<InstituteType>('solo');
  const [academySector, setAcademySector] = useState<string | null>('school_tuition');
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDesktop = Platform.OS === 'web' && isDesktopWidth(width);
  const useDesktopShell = isDesktop && (instituteType === 'academy' || instituteType === 'institute');

  async function refresh() {
    setIsLoading(true);
    try {
      const workspace = await getCurrentWorkspace();
      setInstituteType(workspace?.institute_type ?? 'solo');
      setAcademySector(workspace?.academy_sector ?? 'school_tuition');
      setWorkspaceName(workspace?.name ?? null);
    } catch {
      setInstituteType('solo');
      setAcademySector('school_tuition');
      setWorkspaceName(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      instituteType,
      academySector,
      workspaceName,
      isDesktop,
      useDesktopShell,
      isLoading,
      refresh,
    }),
    [academySector, instituteType, isDesktop, isLoading, useDesktopShell, workspaceName],
  );

  return <WorkspaceShellContext.Provider value={value}>{children}</WorkspaceShellContext.Provider>;
}

export function useWorkspaceShell() {
  const context = useContext(WorkspaceShellContext);
  if (!context) {
    throw new Error('useWorkspaceShell must be used within WorkspaceShellProvider');
  }
  return context;
}
