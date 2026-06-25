import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentWorkspace } from '@/features/auth/authService';
import { isPilotDemoAuthEnabled } from '@/features/auth/demoAuth';
import { ensureDemoWorkspace, isDemoAccountEmail, isDemoAcademyAccountEmail, isDemoItAcademyAccountEmail, isDemoMaritimeAccountEmail } from '@/features/auth/demoSetupService';
import { useI18n } from '@/i18n/I18nProvider';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function IndexScreen() {
  const { t } = useI18n();
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function routeBySession() {
      if (!isSupabaseConfigured) {
        setSetupError(t('auth.bootstrapSetupError'));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        router.replace('/auth/login');
        return;
      }

      let workspace = await getCurrentWorkspace();
      if (
        !workspace &&
        isPilotDemoAuthEnabled() &&
        (await isDemoMaritimeAccountEmail(session.user.email))
      ) {
        router.replace('/onboarding?preset=maritime' as Href);
        return;
      }
      if (
        !workspace &&
        isPilotDemoAuthEnabled() &&
        (await isDemoItAcademyAccountEmail(session.user.email))
      ) {
        router.replace('/onboarding?preset=it' as Href);
        return;
      }
      if (
        !workspace &&
        isPilotDemoAuthEnabled() &&
        (await isDemoAcademyAccountEmail(session.user.email))
      ) {
        router.replace('/onboarding?preset=academy' as Href);
        return;
      }
      if (
        !workspace &&
        isPilotDemoAuthEnabled() &&
        (await isDemoAccountEmail(session.user.email))
      ) {
        await ensureDemoWorkspace();
        workspace = await getCurrentWorkspace();
      }
      if (!isMounted) return;

      router.replace((workspace ? '/(tabs)' : '/onboarding') as Href);
    }

    routeBySession().catch(() => {
      if (isMounted) router.replace('/auth/login');
    });

    return () => {
      isMounted = false;
    };
  }, [t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name={setupError ? 'alert-circle-outline' : 'school'} size={30} color="white" />
        </View>
        {setupError ? null : <ActivityIndicator color={colors.primary} />}
        <Text style={styles.title}>{setupError ? t('auth.bootstrapSetupTitle') : t('auth.bootstrapLoadingTitle')}</Text>
        <Text style={styles.subtitle}>{setupError ?? t('auth.bootstrapLoadingSubtitle')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  logo: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
});
