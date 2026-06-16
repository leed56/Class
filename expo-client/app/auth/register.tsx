import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bootstrapWorkspace } from '@/core/auth/bootstrapWorkspace';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { getSupabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('English');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const languageCode = language === 'සිංහල' ? 'si' : language === 'தமிழ்' ? 'ta' : 'en';

  async function handleRegister() {
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase is not configured yet.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in name, email and password.');
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          preferred_language: languageCode,
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setError('Account created. Check your email if confirmation is required.');
      return;
    }

    try {
      await bootstrapWorkspace({
        userId: data.user.id,
        workspaceName: `${fullName.trim()} Classes`,
        language: languageCode,
      });
    } catch (bootstrapError) {
      setError(bootstrapError instanceof Error ? bootstrapError.message : 'Could not create workspace.');
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Link href={'/auth/login' as Href} asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <Text style={styles.headerTitle}>Create teacher account</Text>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Start free</Text>
          <Text style={styles.heroTitle}>Build your tuition workspace</Text>
          <Text style={styles.heroCopy}>Students, attendance, fees and receipts in one place.</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <FormTextField label="Full name" placeholder="Nimal Perera" icon="account-outline" value={fullName} onChangeText={setFullName} />
          <FormTextField label="Phone" placeholder="+94 77 123 4567" icon="phone-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <FormTextField label="Email" placeholder="teacher@example.com" icon="email-outline" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <FormTextField label="Password" placeholder="Minimum 8 characters" icon="lock-outline" secureTextEntry value={password} onChangeText={setPassword} />
          <ChoiceChipGroup label="Preferred language" selected={language} options={['English', 'සිංහල', 'தமிழ்']} onSelect={setLanguage} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={submitting}>
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerTitle: { flex: 1, color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroCopy: { marginTop: 6, color: '#E7DEFF', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  formCard: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  primaryButton: { height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '900' },
});
