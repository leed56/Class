import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { saveInviteToken } from '@/features/platform/inviteStorage';
import { getPlatformInvite } from '@/features/platform/platformService';
import { resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function InviteLandingScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleInvite() {
      const inviteToken = token?.trim();
      if (!inviteToken) {
        setError(t('auth.inviteInvalid'));
        return;
      }

      try {
        await getPlatformInvite(inviteToken);
        await saveInviteToken(inviteToken);
        if (!active) return;
        router.replace(`/auth/signup?invite=${encodeURIComponent(inviteToken)}` as Href);
      } catch (inviteError) {
        if (!active) return;
        setError(resolveServiceErrorMessage(inviteError, t, 'auth.inviteInvalidOrExpired'));
      }
    }

    void handleInvite();
    return () => {
      active = false;
    };
  }, [router, t, token]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>{t('auth.inviteLoading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background, padding: spacing.xl },
  loadingText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
