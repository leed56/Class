import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { useAuth } from '@/core/auth/AuthProvider';
import { createTeacherWorkspace } from '@/features/auth/authService';
import {
  DEMO_ACADEMY_WORKSPACE_NAME,
  isPilotDemoAuthEnabled,
} from '@/features/auth/demoAuth';
import {
  applyWorkspaceTypeSettings,
  isDemoAcademyAccountEmail,
  seedAcademyDemoData,
} from '@/features/auth/demoSetupService';
import { getTeacherDisplayName } from '@/features/auth/teacherProfile';
import { InstituteType, LanguageCode } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const languageOptions: { label: string; value: LanguageCode; helper: string }[] = [
  { label: 'English', value: 'en', helper: 'Launch default' },
  { label: 'සිංහල', value: 'si', helper: 'Sinhala ready' },
  { label: 'தமிழ்', value: 'ta', helper: 'Tamil ready' },
];

const workspaceTypeOptions: {
  value: InstituteType;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    value: 'solo',
    label: 'Solo tutor',
    subtitle: 'One teacher, simple fees and attendance',
    icon: 'account-outline',
  },
  {
    value: 'academy',
    label: 'Academy',
    subtitle: 'Catalog, admission fee, certificates',
    icon: 'school-outline',
  },
  {
    value: 'institute',
    label: 'Institute',
    subtitle: 'Staff roles, branches and hall reports',
    icon: 'office-building-outline',
  },
];

type OnboardingPreset = 'academy' | 'institute' | 'solo';

export default function OnboardingScreen() {
  const { user } = useAuth();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const presetMode = (preset === 'academy' || preset === 'institute' || preset === 'solo'
    ? preset
    : 'academy') as OnboardingPreset;

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<InstituteType>(presetMode);
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAcademyPreset = presetMode === 'academy';

  useEffect(() => {
    if (isAcademyPreset) {
      setWorkspaceType('academy');
      setWorkspaceName(DEMO_ACADEMY_WORKSPACE_NAME);
      return;
    }

    const teacherName = getTeacherDisplayName(user);
    setWorkspaceName(teacherName === 'Teacher' ? '' : `${teacherName} Classes`);
    setWorkspaceType(presetMode);
  }, [user, isAcademyPreset, presetMode]);

  const heroCopy = useMemo(() => {
    if (workspaceType === 'academy') {
      return {
        label: isAcademyPreset ? 'Sample academy onboarding' : 'Academy setup',
        title: 'Launch your tuition academy workspace.',
        note: 'Set up programs, theory + revision classes, admission fees, and term certificates in one place.',
      };
    }
    if (workspaceType === 'institute') {
      return {
        label: 'Institute setup',
        title: 'Create your multi-branch institute workspace.',
        note: 'Add staff roles, branches, halls, and branch collection reports after setup.',
      };
    }
    return {
      label: 'First-run setup',
      title: 'Create your teacher workspace.',
      note: 'This becomes the secure tenant for students, classes, attendance, fees and receipts.',
    };
  }, [workspaceType, isAcademyPreset]);

  const checklist = useMemo(() => {
    if (workspaceType === 'academy') {
      return [
        { icon: 'book-open-page-variant' as const, title: 'Catalog', copy: 'Programs, batches, theory and revision offerings' },
        { icon: 'cash-plus' as const, title: 'Admission + monthly', copy: 'LKR 2,500 admission and pro-rata monthly billing' },
        { icon: 'certificate-outline' as const, title: 'Certificates', copy: 'PDF completion certs with attendance and fee rules' },
        { icon: 'account-child-outline' as const, title: 'Parent portal', copy: 'Parents check attendance, fees and receipts by phone OTP' },
      ];
    }
    if (workspaceType === 'institute') {
      return [
        { icon: 'account-group-outline' as const, title: 'Staff roles', copy: 'Owner, admin, teacher and front-desk permissions' },
        { icon: 'source-branch' as const, title: 'Branches & halls', copy: 'Multi-location timetable and conflict warnings' },
        { icon: 'file-chart-outline' as const, title: 'Branch reports', copy: 'Collection and attendance by branch each month' },
        { icon: 'certificate-outline' as const, title: 'Certificates', copy: 'Official PDF certificates for parents' },
      ];
    }
    return [
      { icon: 'account-group-outline' as const, title: 'Students', copy: 'Real student records and parent contact details' },
      { icon: 'school-outline' as const, title: 'Classes', copy: 'Subjects, grades, schedules and monthly fees' },
      { icon: 'cash-check' as const, title: 'Cash fees', copy: 'Invoices, payments, receipts and defaulters' },
    ];
  }, [workspaceType]);

  async function handleCreateWorkspace() {
    if (!workspaceName.trim()) {
      setError('Add your class or institute name before continuing.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createTeacherWorkspace({ name: workspaceName, defaultLanguage });
      await applyWorkspaceTypeSettings(workspaceType);

      const shouldSeedAcademy =
        workspaceType === 'academy' &&
        isPilotDemoAuthEnabled() &&
        (isAcademyPreset || (await isDemoAcademyAccountEmail(user?.email)));

      if (shouldSeedAcademy) {
        await seedAcademyDemoData();
      }

      router.replace('/(tabs)');
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Could not create workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name={workspaceType === 'academy' ? 'school-outline' : 'rocket-launch-outline'}
              size={31}
              color="white"
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{heroCopy.label}</Text>
            <Text style={styles.heroTitle}>{heroCopy.title}</Text>
            <Text style={styles.heroNote}>{heroCopy.note}</Text>
          </View>
        </LinearGradient>

        {isAcademyPreset ? (
          <View style={styles.presetBanner}>
            <MaterialCommunityIcons name="test-tube" size={18} color={colors.info} />
            <Text style={styles.presetBannerText}>
              Sample academy flow — finish setup to load demo students, theory + revision classes, and parent portal data.
            </Text>
          </View>
        ) : null}

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>Workspace type</Text>
            <Text style={styles.cardSubtitle}>Choose how ClassFlow should organize your tuition business.</Text>
          </View>
          <View style={styles.typeList}>
            {workspaceTypeOptions.map((option) => {
              const isSelected = workspaceType === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.typeCard, isSelected && styles.typeCardActive]}
                  onPress={() => setWorkspaceType(option.value)}
                >
                  <View style={[styles.typeIcon, isSelected && styles.typeIconActive]}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.typeCopy}>
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>{option.label}</Text>
                    <Text style={styles.typeSubtitle}>{option.subtitle}</Text>
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>Workspace name</Text>
            <Text style={styles.cardSubtitle}>Use the name parents and students already recognize.</Text>
          </View>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.textSecondary} />
            <TextInput
              value={workspaceName}
              onChangeText={setWorkspaceName}
              placeholder="Your institute name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
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
                <Pressable
                  key={option.value}
                  style={[styles.languageCard, isSelected && styles.languageCardActive]}
                  onPress={() => setDefaultLanguage(option.value)}
                >
                  <Text style={[styles.languageLabel, isSelected && styles.languageLabelActive]}>{option.label}</Text>
                  <Text style={[styles.languageHelper, isSelected && styles.languageHelperActive]}>{option.helper}</Text>
                </Pressable>
              );
            })}
          </View>
        </PremiumCard>

        <PremiumCard style={styles.checklistCard}>
          <Text style={styles.cardTitle}>What unlocks next</Text>
          {checklist.map((item) => (
            <SetupItem key={item.title} icon={item.icon} title={item.title} copy={item.copy} />
          ))}
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Plan</Text>
          <Text style={styles.saveValue}>
            {workspaceType === 'academy' ? 'Academy workspace' : workspaceType === 'institute' ? 'Institute workspace' : 'Free workspace'}
          </Text>
        </View>
        <Pressable
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleCreateWorkspace}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="white" />
          )}
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
  hero: {
    minHeight: 178,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.hero,
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 26, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  heroNote: { marginTop: 7, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  presetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  presetBannerText: { flex: 1, color: colors.textPrimary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  typeList: { gap: spacing.sm },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconActive: { backgroundColor: 'white' },
  typeCopy: { flex: 1 },
  typeLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  typeLabelActive: { color: colors.primary },
  typeSubtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  inputWrap: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  languageGrid: { flexDirection: 'row', gap: spacing.sm },
  languageCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  languageCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  languageLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  languageLabelActive: { color: colors.primary },
  languageHelper: { marginTop: 4, color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  languageHelperActive: { color: colors.primary },
  checklistCard: { gap: spacing.md, borderColor: colors.primarySoft },
  setupItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setupIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupCopy: { flex: 1 },
  setupTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  setupText: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  disabledButton: { opacity: 0.72 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
