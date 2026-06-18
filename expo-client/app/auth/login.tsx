import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter, type Href } from 'expo-router';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/core/auth/AuthProvider';
import {
  DEMO_ACADEMY_EMAIL,
  DEMO_ACADEMY_PASSWORD,
  DEMO_IT_ACADEMY_EMAIL,
  DEMO_IT_ACADEMY_PASSWORD,
  DEMO_MARITIME_EMAIL,
  DEMO_MARITIME_PASSWORD,
  DEMO_TEACHER_EMAIL,
  DEMO_TEACHER_PASSWORD,
  isPilotDemoAuthEnabled,
} from '@/features/auth/demoAuth';
import {
  ensureDemoWorkspace,
  isDemoAccountEmail,
  isDemoAcademyAccountEmail,
  isDemoItAcademyAccountEmail,
  isDemoMaritimeAccountEmail,
} from '@/features/auth/demoSetupService';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { isPlatformAdmin } from '@/features/platform/platformService';
import { FormTextField } from '@/features/students/components/FormTextField';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { demoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPlatformAdmin, setShowPlatformAdmin] = useState(false);

  useEffect(() => {
    isPlatformAdmin().then(setShowPlatformAdmin).catch(() => setShowPlatformAdmin(false));
  }, []);

  async function routeAfterTeacherLogin(signedInEmail?: string) {
    const loginEmail = signedInEmail ?? email;
    let workspace = await getCurrentWorkspace();

    if (!workspace && isPilotDemoAuthEnabled() && (await isDemoMaritimeAccountEmail(loginEmail))) {
      router.replace('/onboarding?preset=maritime' as Href);
      return;
    }

    if (!workspace && isPilotDemoAuthEnabled() && (await isDemoItAcademyAccountEmail(loginEmail))) {
      router.replace('/onboarding?preset=it' as Href);
      return;
    }

    if (!workspace && isPilotDemoAuthEnabled() && (await isDemoAcademyAccountEmail(loginEmail))) {
      router.replace('/onboarding?preset=academy' as Href);
      return;
    }

    if (!workspace && isPilotDemoAuthEnabled() && (await isDemoAccountEmail(loginEmail))) {
      await ensureDemoWorkspace();
      workspace = await getCurrentWorkspace();
    }

    router.replace((workspace ? '/(tabs)' : '/onboarding') as Href);
  }

  async function handleLogin() {
    setError(null);

    if (demoMode) {
      router.replace('/(tabs)');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase is not configured yet.');
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setSubmitting(false);
      setError(signInError.message);
      return;
    }

    try {
      await routeAfterTeacherLogin(email);
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Could not finish sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoAdminLogin() {
    setError(null);
    setEmail(DEMO_TEACHER_EMAIL);
    setPassword(DEMO_TEACHER_PASSWORD);

    if (demoMode) {
      router.replace('/(tabs)');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase is not configured yet.');
      return;
    }

    setSubmitting(true);
    const signInResult = await supabase.auth.signInWithPassword({
      email: DEMO_TEACHER_EMAIL,
      password: DEMO_TEACHER_PASSWORD,
    });

    if (signInResult.error) {
      const signUpResult = await supabase.auth.signUp({
        email: DEMO_TEACHER_EMAIL,
        password: DEMO_TEACHER_PASSWORD,
      });
      if (signUpResult.error) {
        setSubmitting(false);
        setError(signUpResult.error.message);
        return;
      }
      if (!signUpResult.data.session) {
        setSubmitting(false);
        setError('Demo account created. Confirm the email in Supabase Auth, then retry demo login.');
        return;
      }
    }

    try {
      await routeAfterTeacherLogin(DEMO_TEACHER_EMAIL);
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Could not finish demo sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoAcademyLogin() {
    setError(null);
    setEmail(DEMO_ACADEMY_EMAIL);
    setPassword(DEMO_ACADEMY_PASSWORD);

    if (demoMode) {
      router.replace('/onboarding?preset=academy' as Href);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase is not configured yet.');
      return;
    }

    setSubmitting(true);
    const signInResult = await supabase.auth.signInWithPassword({
      email: DEMO_ACADEMY_EMAIL,
      password: DEMO_ACADEMY_PASSWORD,
    });

    if (signInResult.error) {
      const signUpResult = await supabase.auth.signUp({
        email: DEMO_ACADEMY_EMAIL,
        password: DEMO_ACADEMY_PASSWORD,
      });
      if (signUpResult.error) {
        setSubmitting(false);
        setError(signUpResult.error.message);
        return;
      }
      if (!signUpResult.data.session) {
        setSubmitting(false);
        setError('Demo academy account created. Confirm the email in Supabase Auth, then retry.');
        return;
      }
    }

    try {
      await routeAfterTeacherLogin(DEMO_ACADEMY_EMAIL);
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Could not finish academy demo sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSectorDemoLogin(demoEmail: string, demoPassword: string, preset: 'maritime' | 'it') {
    setError(null);
    setEmail(demoEmail);
    setPassword(demoPassword);

    if (demoMode) {
      router.replace(`/onboarding?preset=${preset}` as Href);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase is not configured yet.');
      return;
    }

    setSubmitting(true);
    const signInResult = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });

    if (signInResult.error) {
      const signUpResult = await supabase.auth.signUp({ email: demoEmail, password: demoPassword });
      if (signUpResult.error) {
        setSubmitting(false);
        setError(signUpResult.error.message);
        return;
      }
      if (!signUpResult.data.session) {
        setSubmitting(false);
        setError('Demo account created. Confirm the email in Supabase Auth, then retry.');
        return;
      }
    }

    try {
      await routeAfterTeacherLogin(demoEmail);
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Could not finish demo sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.logoMark}>
            <MaterialCommunityIcons name="school" size={34} color="white" />
          </View>
          <Text style={styles.heroTitle}>ClassFlow</Text>
          <Text style={styles.heroCopy}>Smart class management for Sri Lankan teachers</Text>
        </LinearGradient>

        {isPilotDemoAuthEnabled() && isSupabaseConfigured ? (
          <View style={styles.pilotBanner}>
            <MaterialCommunityIcons name="test-tube" size={18} color={colors.info} />
            <View style={styles.pilotCopy}>
              <Text style={styles.pilotTitle}>Pilot demos</Text>
              <Text style={styles.pilotText}>
                Institute: {DEMO_TEACHER_EMAIL} / {DEMO_TEACHER_PASSWORD}
              </Text>
              <Text style={styles.pilotText}>
                Academy: {DEMO_ACADEMY_EMAIL} / {DEMO_ACADEMY_PASSWORD}
              </Text>
              <Text style={styles.pilotText}>
                Maritime: {DEMO_MARITIME_EMAIL} / {DEMO_MARITIME_PASSWORD}
              </Text>
              <Text style={styles.pilotText}>
                IT: {DEMO_IT_ACADEMY_EMAIL} / {DEMO_IT_ACADEMY_PASSWORD}
              </Text>
            </View>
          </View>
        ) : null}

        {!isSupabaseConfigured ? (
          <View style={styles.demoBanner}>
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.warning} />
            <Text style={styles.demoBannerText}>
              Demo mode: add Supabase env keys to enable secure sign-in.
            </Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Teacher sign in</Text>
          <FormTextField
            label="Email"
            placeholder="teacher@example.com"
            icon="email-outline"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <FormTextField
            label="Password"
            placeholder="Your password"
            icon="lock-outline"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>{demoMode ? 'Continue in demo mode' : 'Sign in'}</Text>
            )}
          </Pressable>
          {isPilotDemoAuthEnabled() && isSupabaseConfigured ? (
            <>
              <Pressable style={styles.secondaryButton} onPress={handleDemoAcademyLogin} disabled={submitting}>
                <Text style={styles.secondaryButtonText}>Try sample academy onboarding</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleDemoAdminLogin} disabled={submitting}>
                <Text style={styles.secondaryButtonText}>Quick demo institute login</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void handleSectorDemoLogin(DEMO_MARITIME_EMAIL, DEMO_MARITIME_PASSWORD, 'maritime')}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>Maritime academy demo</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void handleSectorDemoLogin(DEMO_IT_ACADEMY_EMAIL, DEMO_IT_ACADEMY_PASSWORD, 'it')}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>IT academy demo</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        {showPlatformAdmin ? (
          <Link href={'/platform' as Href} asChild>
            <Pressable style={styles.parentLinkCard}>
              <MaterialCommunityIcons name="shield-crown-outline" size={20} color={colors.primary} />
              <Text style={styles.parentLinkText}>Platform admin console</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          </Link>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New teacher?</Text>
          <Link href={'/auth/signup' as Href} asChild>
            <Pressable>
              <Text style={styles.footerLink}>Create account</Text>
            </Pressable>
          </Link>
        </View>

        <Link href={'/parent/login' as Href} asChild>
          <Pressable style={styles.parentLinkCard}>
            <MaterialCommunityIcons name="account-child-outline" size={20} color={colors.primary} />
            <Text style={styles.parentLinkText}>Parent? Open parent portal</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, alignItems: 'center', overflow: 'hidden' },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroTitle: { marginTop: spacing.lg, color: 'white', fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  heroCopy: { marginTop: spacing.sm, color: '#E7DEFF', fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  demoBannerText: { flex: 1, color: colors.textPrimary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  pilotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pilotCopy: { flex: 1 },
  pilotTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  pilotText: { marginTop: 2, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  formCard: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  primaryButton: { height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '900' },
  secondaryButton: { height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  footerText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  footerLink: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  parentLinkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  parentLinkText: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
});
