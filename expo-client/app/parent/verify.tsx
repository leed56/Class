import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMO_PARENT_OTP } from '@/features/auth/demoAuth';
import { formatParentPhone, verifyParentOtp } from '@/features/parent/parentAuthService';
import { FormTextField } from '@/features/students/components/FormTextField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ParentVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    childCount?: string;
    code?: string;
    expiresAt?: string;
  }>();
  const [otp, setOtp] = useState(params.code ?? DEMO_PARENT_OTP);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.code) {
      setOtp(params.code);
      return;
    }
    setOtp(DEMO_PARENT_OTP);
  }, [params.code]);

  async function handleVerify() {
    if (!params.phone) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await verifyParentOtp(params.phone, otp);
      if (session.children.length === 1) {
        router.replace(`/parent/child/${session.children[0].id}` as Href);
        return;
      }
      router.replace('/parent' as Href);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Could not verify code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Link href="/parent/login" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Enter login code</Text>
            <Text style={styles.subtitle}>
              {params.phone ? formatParentPhone(params.phone) : 'Parent phone'} • {params.childCount ?? '0'} child
              {Number(params.childCount ?? 0) === 1 ? '' : 'ren'}
            </Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>One-time code</Text>
          <Text style={styles.heroTitle}>Verify parent access</Text>
          <Text style={styles.heroNote}>Pilot testing uses a fixed code: {DEMO_PARENT_OTP}. SMS via Notify.lk is planned later.</Text>
        </LinearGradient>

        {params.code ? (
          <View style={styles.pilotBanner}>
            <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.info} />
            <View style={styles.pilotCopy}>
              <Text style={styles.pilotTitle}>Pilot login code</Text>
              <Text style={styles.pilotCode}>{params.code}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <FormTextField
            label="6-digit code"
            placeholder="000000"
            icon="shield-key-outline"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleVerify} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify and continue</Text>
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
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  pilotBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primarySoft, backgroundColor: colors.surface, padding: spacing.lg },
  pilotCopy: { flex: 1 },
  pilotTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  pilotCode: { marginTop: 4, color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: 6 },
  formCard: { gap: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primary },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
});
