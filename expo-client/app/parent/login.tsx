import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestParentOtp } from '@/features/parent/parentAuthService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import {
  DEMO_PARENT_OTP,
  DEMO_PARENT_PHONE,
  DEMO_TEACHER_EMAIL,
  DEMO_TEACHER_PASSWORD,
  isPilotDemoAuthEnabled,
} from '@/features/auth/demoAuth';
import { FormTextField } from '@/features/students/components/FormTextField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ParentLoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [phone, setPhone] = useState(isPilotDemoAuthEnabled() ? DEMO_PARENT_PHONE : '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await requestParentOtp(phone);
      router.push({
        pathname: '/parent/verify',
        params: {
          phone: result.phone,
          childCount: String(result.childCount),
          code: result.code ?? '',
          expiresAt: result.expiresAt,
        },
      });
    } catch (submitError) {
      setError(resolveServiceErrorMessage(submitError, t, 'parent.otpRequestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Link href="/auth/login" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('parent.loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('parent.loginSubtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="account-child-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('parent.loginHeroLabel')}</Text>
            <Text style={styles.heroTitle}>{t('parent.loginHeroTitle')}</Text>
            <Text style={styles.heroNote}>{t('parent.loginHeroNote')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('parent.phoneLabel')}</Text>
          {isPilotDemoAuthEnabled() ? (
            <View style={styles.demoBanner}>
              <MaterialCommunityIcons name="test-tube" size={18} color={colors.info} />
              <View style={styles.demoCopy}>
                <Text style={styles.demoTitle}>{t('parent.demoTitle')}</Text>
                <Text style={styles.demoText}>
                  {interpolate(t('parent.demoText'), { phone: DEMO_PARENT_PHONE, otp: DEMO_PARENT_OTP })}
                </Text>
              </View>
            </View>
          ) : null}
          <FormTextField
            label={t('parent.phoneLabel')}
            placeholder={t('parent.phonePlaceholder')}
            icon="phone-outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            helper={isPilotDemoAuthEnabled() ? t('parent.otpHint') : t('parent.otpHintSms')}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {isPilotDemoAuthEnabled() ? (
            <Pressable style={styles.secondaryButton} onPress={handleContinue} disabled={isSubmitting}>
              <Text style={styles.secondaryButtonText}>{t('parent.quickDemoLogin')}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('parent.sendOtp')}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  formCard: { gap: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  formTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primary },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  demoBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primarySoft, backgroundColor: colors.surface, padding: spacing.md },
  demoCopy: { flex: 1 },
  demoTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  demoText: { marginTop: 2, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
});
