import { StyleSheet, View, ViewStyle } from 'react-native';

import { useWorkspaceShell } from '@/core/layout/WorkspaceShellContext';
import { spacing } from '@/theme/spacing';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function PageContainer({ children, style }: Props) {
  const { useDesktopShell } = useWorkspaceShell();

  return (
    <View style={[useDesktopShell ? styles.desktop : styles.mobile, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: {
    flex: 1,
  },
  desktop: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
});
