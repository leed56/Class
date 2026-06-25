import { Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { isPlatformAdmin } from '@/features/platform/platformService';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function PlatformAdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    isPlatformAdmin()
      .then((next) => {
        if (!active) return;
        setAllowed(next);
        if (!next) router.replace('/auth/login' as Href);
      })
      .catch(() => {
        if (!active) return;
        setAllowed(false);
        router.replace('/auth/login' as Href);
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (allowed === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>{t('platformAdmin.checkingAccess')}</Text>
      </View>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
});
