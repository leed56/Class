import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { useAuth } from '@/core/auth/AuthProvider';
import { createTeacherWorkspace } from '@/features/auth/authService';
import { getTeacherDisplayName } from '@/features/auth/teacherProfile';
import { LanguageCode } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const languageOptions: { label: string; value: LanguageCode; helper: string }[] = [
  { label: 'English', value: 'en', helper: 'Launch default' },
  { label: 'සිංහල', value: 'si', helper: 'Sinhala ready' },
  { label: 'தமிழ்', value: 'ta', helper: 'Tamil ready' },
];

function suggestWorkspaceName(user: Parameters<typeof getTeacherDisplayName>[0]) {
  const teacherName = getTeacherDisplayName(user);
  return teacherName === 'Teacher' ? '' : `${teacherName} Classes`;
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [workspaceName, setWorkspaceName] = useState(() => suggestWorkspaceName(user));
  const [suggestedForUser, setSuggestedForUser] = useState(user);
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh the suggested workspace name when the signed-in teacher resolves/changes.
  if (user !== suggestedForUser) {
    setSuggestedForUser(user);
    setWorkspaceName(suggestWorkspaceName(user));
  }

  async function handleCreateWorkspace() {
    if (!workspaceName.trim()) {
      setError('Add your class or institute name before continuing.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createTeacherWorkspace({ name: workspaceName, defaultLanguage });
      router.replace('/(tabs)');
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Could not create workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={31} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>First-run setup</Text>
            <Text style={styles.heroTitle}>Create your teacher workspace.</Text>
            <Text style={styles.heroNote}>This becomes the secure tenant for students, classes, attendance, fees and receipts.</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>Workspace name</Text>
            <Text style={styles.cardSubtitle}>Use the name parents and students already recognize.</Text>
          </View>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.textSecondary} />
            <TextInput value={workspaceName} onChangeText={setWorkspaceName} placeholder="Your institute name" placeholderTextColor={colors.textMuted} style={styles.input} />
          </View>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>Default language</Text>
            <Text style={styles.cardSubtitle}>The MVP starts in English, with Sinhala and Tamil foundation ready.</Text>
          </View>
          <View style={styles.languageGrid}>
            {languageOptions.map((option) => {
              const isSelected = option.value === defaultLanguage;
              return (
                <Pressable key={option.value} style={[styles.languageCard, isSelected && styles.languageCardActive]} onPress={() => setDefaultLanguage(option.value)}>
                  <Text style={[styles.languageLabel, isSelected && styles.languageLabelActive]}>{option.label}</Text>
                  <Text style={[styles.languageHelper, isSelected && styles.languageHelperActive]}>{option.helper}</Text>
                </Pressable>
              );
            })}
          </View>
        </PremiumCard>

        <PremiumCard style={styles.checklistCard}>
          <Text style={styles.cardTitle}>What unlocks next</Text>
          <SetupItem icon="account-group-outline" title="Students" copy="Real student records and parent contact details" />
          <SetupItem icon="school-outline" title="Classes" copy="Subjects, grades, halls, schedules and fees" />
          <SetupItem icon="cash-check" title="Cash fees" copy="Invoices, payments, receipts and defaulters" />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Plan</Text>
          <Text style={styles.saveValue}>Free workspace</Text>
        </View>
        <Pressable style={[styles.saveButton, isLoading && styles.disabledButton]} onPress={handleCreateWorkspace} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="check-circle-outline" size={18} color="white" />}
          <Text style={styles.saveButtonText}>{isLoading ? 'Creating...' : 'Enter Dashboard'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SetupItem({ icon, title, copy }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; copy: string }) {
  return (
    <View style={styles.setupItem}>
      <View style={styles.setupIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.setupCopy}>
        <Text style={styles.setupTitle}>{title}</Text>
        <Text style={styles.setupText}>{copy}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  hero: { minHeight: 178, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 60, height: 60, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 26, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  heroNote: { marginTop: 7, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  inputWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  languageGrid: { flexDirection: 'row', gap: spacing.sm },
  languageCard: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background, padding: spacing.md },
  languageCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  languageLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  languageLabelActive: { color: colors.primary },
  languageHelper: { marginTop: 4, color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  languageHelperActive: { color: colors.primary },
  checklistCard: { gap: spacing.md, borderColor: colors.primarySoft },
  setupItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setupIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  setupCopy: { flex: 1 },
  setupTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  setupText: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  disabledButton: { opacity: 0.72 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
