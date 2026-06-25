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
  DEMO_IT_ACADEMY_WORKSPACE_NAME,
  DEMO_MARITIME_WORKSPACE_NAME,
  isPilotDemoAuthEnabled,
} from '@/features/auth/demoAuth';
import {
  applyWorkspaceTypeSettings,
  isDemoAcademyAccountEmail,
  isDemoItAcademyAccountEmail,
  isDemoMaritimeAccountEmail,
  seedAcademyDemoData,
} from '@/features/auth/demoSetupService';
import { getTeacherDisplayName, TEACHER_DISPLAY_FALLBACK } from '@/features/auth/teacherProfile';
import {
  AcademySector,
  DEFAULT_ACADEMY_SECTOR,
} from '@/features/courses/slCourseModel';
import { InstituteType, LanguageCode } from '@/lib/database.types';
import { clearInviteToken, readInviteToken } from '@/features/platform/inviteStorage';
import { consumePlatformInvite, getPlatformInvite } from '@/features/platform/platformService';
import { getLocalizedSectorInfo, interpolate, listLocalizedSectors, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const languageOptionValues: {
  value: LanguageCode;
  settingsLabelKey: 'english' | 'sinhala' | 'tamil';
  helperKey: 'langEnHelper' | 'langSiHelper' | 'langTaHelper';
}[] = [
  { value: 'en', settingsLabelKey: 'english', helperKey: 'langEnHelper' },
  { value: 'si', settingsLabelKey: 'sinhala', helperKey: 'langSiHelper' },
  { value: 'ta', settingsLabelKey: 'tamil', helperKey: 'langTaHelper' },
];

const workspaceTypeValues: {
  value: InstituteType;
  labelKey: 'typeSoloLabel' | 'typeAcademyLabel' | 'typeInstituteLabel';
  subtitleKey: 'typeSoloSubtitle' | 'typeAcademySubtitle' | 'typeInstituteSubtitle';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { value: 'solo', labelKey: 'typeSoloLabel', subtitleKey: 'typeSoloSubtitle', icon: 'account-outline' },
  { value: 'academy', labelKey: 'typeAcademyLabel', subtitleKey: 'typeAcademySubtitle', icon: 'school-outline' },
  { value: 'institute', labelKey: 'typeInstituteLabel', subtitleKey: 'typeInstituteSubtitle', icon: 'office-building-outline' },
];

type OnboardingPreset = 'academy' | 'institute' | 'solo' | 'maritime' | 'it';

export default function OnboardingScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const presetMode = (preset === 'academy' ||
    preset === 'institute' ||
    preset === 'solo' ||
    preset === 'maritime' ||
    preset === 'it'
    ? preset
    : 'academy') as OnboardingPreset;

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<InstituteType>(presetMode === 'institute' ? 'institute' : presetMode === 'solo' ? 'solo' : 'academy');
  const [academySector, setAcademySector] = useState<AcademySector>(
    presetMode === 'maritime' ? 'maritime' : presetMode === 'it' ? 'it_technology' : DEFAULT_ACADEMY_SECTOR,
  );
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLocked, setInviteLocked] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const isAcademyPreset = presetMode === 'academy' || presetMode === 'maritime' || presetMode === 'it';

  const localizedSectors = useMemo(() => listLocalizedSectors(t), [t]);
  const selectedSector = useMemo(() => getLocalizedSectorInfo(academySector, t), [academySector, t]);

  useEffect(() => {
    if (presetMode === 'maritime') {
      setWorkspaceType('academy');
      setAcademySector('maritime');
      setWorkspaceName(DEMO_MARITIME_WORKSPACE_NAME);
      return;
    }
    if (presetMode === 'it') {
      setWorkspaceType('academy');
      setAcademySector('it_technology');
      setWorkspaceName(DEMO_IT_ACADEMY_WORKSPACE_NAME);
      return;
    }
    if (isAcademyPreset && presetMode === 'academy') {
      setWorkspaceType('academy');
      setWorkspaceName(DEMO_ACADEMY_WORKSPACE_NAME);
      return;
    }

    const teacherName = getTeacherDisplayName(user);
    setWorkspaceName(teacherName === TEACHER_DISPLAY_FALLBACK ? '' : `${teacherName} Classes`);
    setWorkspaceType(presetMode === 'institute' ? 'institute' : presetMode === 'solo' ? 'solo' : 'academy');
  }, [user, isAcademyPreset, presetMode]);

  useEffect(() => {
    let active = true;

    async function loadInvite() {
      const token = await readInviteToken();
      if (!token || !active) return;

      try {
        const invite = await getPlatformInvite(token);
        setInviteToken(token);
        setInviteLocked(true);
        setWorkspaceType(invite.instituteType);
        if (invite.workspaceNameHint) setWorkspaceName(invite.workspaceNameHint);
        if (invite.academySector) setAcademySector(invite.academySector as AcademySector);
      } catch {
        await clearInviteToken();
      }
    }

    void loadInvite();
    return () => {
      active = false;
    };
  }, []);

  const heroCopy = useMemo(() => {
    if (workspaceType === 'academy') {
      return {
        label: isAcademyPreset ? t('onboarding.sampleAcademyLabel') : t('onboarding.heroAcademyLabel'),
        title: t('onboarding.heroAcademyTitle'),
        note: t('onboarding.heroAcademyNote'),
      };
    }
    if (workspaceType === 'institute') {
      return {
        label: t('onboarding.heroInstituteLabel'),
        title: t('onboarding.heroInstituteTitle'),
        note: t('onboarding.heroInstituteNote'),
      };
    }
    return {
      label: t('onboarding.heroSoloLabel'),
      title: t('onboarding.heroSoloTitle'),
      note: t('onboarding.heroSoloNote'),
    };
  }, [workspaceType, isAcademyPreset, t]);

  const checklist = useMemo(() => {
    if (workspaceType === 'academy') {
      return [
        { icon: 'book-open-page-variant' as const, title: t('onboarding.checklistAcademyCatalog'), copy: t('onboarding.checklistAcademyCatalogCopy') },
        { icon: 'cash-plus' as const, title: t('onboarding.checklistAcademyAdmission'), copy: t('onboarding.checklistAcademyAdmissionCopy') },
        { icon: 'certificate-outline' as const, title: t('onboarding.checklistAcademyCerts'), copy: t('onboarding.checklistAcademyCertsCopy') },
        { icon: 'account-child-outline' as const, title: t('onboarding.checklistAcademyParent'), copy: t('onboarding.checklistAcademyParentCopy') },
      ];
    }
    if (workspaceType === 'institute') {
      return [
        { icon: 'office-building-outline' as const, title: t('onboarding.checklistInstituteHalls'), copy: t('onboarding.checklistInstituteHallsCopy') },
        { icon: 'account-group-outline' as const, title: t('onboarding.checklistInstituteTeachers'), copy: t('onboarding.checklistInstituteTeachersCopy') },
        { icon: 'cash-multiple' as const, title: t('onboarding.checklistInstituteRent'), copy: t('onboarding.checklistInstituteRentCopy') },
        { icon: 'file-chart-outline' as const, title: t('onboarding.checklistInstituteReports'), copy: t('onboarding.checklistInstituteReportsCopy') },
      ];
    }
    return [
      { icon: 'account-group-outline' as const, title: t('onboarding.checklistSoloStudents'), copy: t('onboarding.checklistSoloStudentsCopy') },
      { icon: 'school-outline' as const, title: t('onboarding.checklistSoloClasses'), copy: t('onboarding.checklistSoloClassesCopy') },
      { icon: 'cash-check' as const, title: t('onboarding.checklistSoloFees'), copy: t('onboarding.checklistSoloFeesCopy') },
    ];
  }, [workspaceType, t]);

  async function handleCreateWorkspace() {
    if (!workspaceName.trim()) {
      setError(t('onboarding.nameRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (inviteToken) {
        await consumePlatformInvite(inviteToken);
      }

      await createTeacherWorkspace({ name: workspaceName, defaultLanguage });
      const sectorForWorkspace = workspaceType === 'academy' ? academySector : 'school_tuition';
      await applyWorkspaceTypeSettings(workspaceType, sectorForWorkspace);

      const shouldSeedAcademy =
        workspaceType === 'academy' &&
        isPilotDemoAuthEnabled() &&
        (isAcademyPreset ||
          (await isDemoAcademyAccountEmail(user?.email)) ||
          (await isDemoMaritimeAccountEmail(user?.email)) ||
          (await isDemoItAcademyAccountEmail(user?.email)));

      if (shouldSeedAcademy) {
        await seedAcademyDemoData(sectorForWorkspace);
      }

      await clearInviteToken();
      router.replace('/(tabs)');
    } catch (setupError) {
      setError(resolveServiceErrorMessage(setupError, t, 'onboarding.createFailed'));
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
              {academySector === 'maritime'
                ? t('onboarding.presetMaritime')
                : academySector === 'it_technology'
                  ? t('onboarding.presetIt')
                  : t('onboarding.presetAcademy')}
            </Text>
          </View>
        ) : inviteLocked ? (
          <View style={styles.presetBanner}>
            <MaterialCommunityIcons name="link-variant" size={18} color={colors.info} />
            <Text style={styles.presetBannerText}>{t('onboarding.inviteBanner')}</Text>
          </View>
        ) : null}

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{t('onboarding.workspaceTypeTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('onboarding.workspaceTypeSubtitle')}</Text>
          </View>
          <View style={styles.typeList}>
            {workspaceTypeValues.map((option) => {
              const isSelected = workspaceType === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.typeCard, isSelected && styles.typeCardActive]}
                  onPress={() => {
                    if (inviteLocked) return;
                    setWorkspaceType(option.value);
                  }}
                >
                  <View style={[styles.typeIcon, isSelected && styles.typeIconActive]}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.typeCopy}>
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>{t(`onboarding.${option.labelKey}`)}</Text>
                    <Text style={styles.typeSubtitle}>{t(`onboarding.${option.subtitleKey}`)}</Text>
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </PremiumCard>

        {workspaceType === 'academy' ? (
          <PremiumCard style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{t('onboarding.sectorTitle')}</Text>
              <Text style={styles.cardSubtitle}>
                {inviteLocked ? t('onboarding.sectorSubtitleInvite') : t('onboarding.sectorSubtitle')}
              </Text>
            </View>
            {inviteLocked ? (
              selectedSector ? (
                <View style={styles.sectorLockedCard}>
                  <MaterialCommunityIcons
                    name={selectedSector.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={22}
                    color={colors.primary}
                  />
                  <View style={styles.sectorLockedCopy}>
                    <Text style={styles.sectorLockedTitle}>{selectedSector.label}</Text>
                    <Text style={styles.sectorHint}>
                      {interpolate(t('onboarding.sectorExamples'), { examples: selectedSector.examples })}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} />
                </View>
              ) : null
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectorScroll}>
                  {localizedSectors.map((item) => {
                    const active = academySector === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.sectorCard, active && styles.sectorCardActive]}
                        onPress={() => setAcademySector(item.id)}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={18}
                          color={active ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[styles.sectorLabel, active && styles.sectorLabelActive]} numberOfLines={2}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {selectedSector ? (
                  <Text style={styles.sectorHint}>
                    {interpolate(t('onboarding.sectorExamples'), { examples: selectedSector.examples })}
                  </Text>
                ) : null}
              </>
            )}
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{t('onboarding.workspaceNameTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('onboarding.workspaceNameSubtitle')}</Text>
          </View>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.textSecondary} />
            <TextInput
              value={workspaceName}
              onChangeText={setWorkspaceName}
              placeholder={t('onboarding.workspaceNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{t('onboarding.languageTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('onboarding.languageSubtitle')}</Text>
          </View>
          <View style={styles.languageGrid}>
            {languageOptionValues.map((option) => {
              const isSelected = option.value === defaultLanguage;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.languageCard, isSelected && styles.languageCardActive]}
                  onPress={() => setDefaultLanguage(option.value)}
                >
                  <Text style={[styles.languageLabel, isSelected && styles.languageLabelActive]}>{t(`settings.${option.settingsLabelKey}`)}</Text>
                  <Text style={[styles.languageHelper, isSelected && styles.languageHelperActive]}>{t(`onboarding.${option.helperKey}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </PremiumCard>

        <PremiumCard style={styles.checklistCard}>
          <Text style={styles.cardTitle}>{t('onboarding.checklistTitle')}</Text>
          {checklist.map((item) => (
            <SetupItem key={item.title} icon={item.icon} title={item.title} copy={item.copy} />
          ))}
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('onboarding.planLabel')}</Text>
          <Text style={styles.saveValue}>
            {workspaceType === 'academy'
              ? t('onboarding.planAcademy')
              : workspaceType === 'institute'
                ? t('onboarding.planInstitute')
                : t('onboarding.planFree')}
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
          <Text style={styles.saveButtonText}>{isLoading ? t('onboarding.creating') : t('onboarding.enterDashboard')}</Text>
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
  sectorScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
  sectorCard: {
    width: 148,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    padding: spacing.sm,
  },
  sectorCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  sectorLabel: { flex: 1, color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
  sectorLabelActive: { color: colors.primary },
  sectorHint: { color: colors.textMuted, fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  sectorLockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
  },
  sectorLockedCopy: { flex: 1, gap: 2 },
  sectorLockedTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
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
