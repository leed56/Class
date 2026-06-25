import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { signUpTeacher } from '@/features/auth/authService';
import { readInviteToken, saveInviteToken } from '@/features/platform/inviteStorage';
import { resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function SignupScreen() {
  const { t } = useI18n();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function persistInvite() {
      const token = invite?.trim();
      if (token) {
        await saveInviteToken(token);
        return;
      }
      const stored = await readInviteToken();
      if (stored) return;
    }
    void persistInvite();
  }, [invite]);

  async function handleSignup() {
    if (!email.trim() || password.length < 6) {
      setError(t('auth.passwordInvalid'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await signUpTeacher({ email, password });

      if (result.session) {
        router.replace('/onboarding' as Href);
        return;
      }

      setSuccessMessage(t('auth.signupSuccess'));
    } catch (authError) {
      setError(resolveServiceErrorMessage(authError, t, 'auth.signupFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/auth/login" asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('auth.signupTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="crown-outline" size={29} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('auth.signupHeroLabel')}</Text>
            <Text style={styles.heroTitle}>{t('auth.signupHeroTitle')}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={19} color={colors.textSecondary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={19} color={colors.textSecondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <Pressable style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleSignup} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="account-plus" size={19} color="white" />}
            <Text style={styles.primaryButtonText}>{isLoading ? t('auth.creating') : t('auth.createAccount')}</Text>
          </Pressable>

          {successMessage ? (
            <Link href="/auth/login" asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('auth.goToSignIn')}</Text>
              </Pressable>
            </Link>
          ) : null}
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { minHeight: 148, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  card: { gap: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  inputWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  successText: { color: colors.success, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  primaryButton: { height: 54, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  disabledButton: { opacity: 0.72 },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '900' },
  secondaryButton: { height: 50, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
});
