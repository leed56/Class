import { Href, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Permission } from '@/features/auth/permissions';
import { useWorkspaceRole } from '@/features/auth/useWorkspaceRole';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type PermissionGateProps = {
  permission: Permission;
  children: React.ReactNode;
  fallbackHref?: Href;
  message?: string;
};

export function PermissionGate({
  permission,
  children,
  fallbackHref = '/(tabs)/more' as Href,
  message = 'You do not have permission to open this screen.',
}: PermissionGateProps) {
  const router = useRouter();
  const { isLoading, hasPermission } = useWorkspaceRole();
  const allowed = hasPermission(permission);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace(fallbackHref);
    }
  }, [allowed, fallbackHref, isLoading, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!allowed) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  message: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
