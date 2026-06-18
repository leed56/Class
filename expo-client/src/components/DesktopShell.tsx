import { StyleSheet, View } from 'react-native';

import { useWorkspaceShell } from '@/core/layout/WorkspaceShellContext';
import { colors } from '@/theme/colors';

import { DesktopSidebar } from './DesktopSidebar';

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const { useDesktopShell } = useWorkspaceShell();

  if (!useDesktopShell) {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      <DesktopSidebar />
      <View style={styles.main}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    minHeight: '100vh' as unknown as number,
  },
  main: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
});
