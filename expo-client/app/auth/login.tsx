import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace, signInTeacher } from '@/features/auth/authService';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInTeacher({ email, password });
      const workspace = await getCurrentWorkspace();
      router.replace(workspace ? '/(tabs)' : '/onboarding');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="school" size={32} color="white" />
          </View>
          <Text style={styles.heroKicker}>ClassFlow Teacher Cloud</Text>
          <Text style={styles.heroTitle}>Run your tuition class like a premium institute.</Text>
          <Text style={styles.heroNote}>Attendance, cash fees, receipts and parent follow-ups in one mobile-first workspace.</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue to your teacher dashboard.</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={19} color={colors.textSecondary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="teacher@classflow.lk"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={19} color={colors.textSecondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="login" size={19} color="white" />}
            <Text style={styles.primaryButtonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to ClassFlow?</Text>
            <Link href="/auth/signup" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Create account</Text>
              </Pressable>
            </Link>
          </View>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 32 },
  hero: { minHeight: 250, borderRadius: radius.hero, padding: spacing.xxl, justifyContent: 'flex-end', overflow: 'hidden' },
  heroIcon: { width: 62, height: 62, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  heroKicker: { color: '#E7DEFF', fontSize: 12, fontWeight: '900' },
  heroTitle: { marginTop: 6, color: 'white', fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.9 },
  heroNote: { marginTop: 8, color: '#E7DEFF', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  card: { gap: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 5, color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  inputWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  primaryButton: { height: 54, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  disabledButton: { opacity: 0.72 },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '900' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  footerText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  footerLink: { color: colors.primary, fontSize: 13, fontWeight: '900' },
});
