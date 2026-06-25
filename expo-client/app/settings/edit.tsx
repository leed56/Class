import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  getCurrentWorkspace,
  updateTeacherProfile,
  updateWorkspace,
} from '@/features/auth/authService';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getDefaultAbsenceAlertTemplate } from '@/features/communications/communicationService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageCode, InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const languageValues: LanguageCode[] = ['en', 'si', 'ta'];
const instituteTypeValues: InstituteType[] = ['solo', 'academy', 'institute'];

export default function EditSettingsScreen() {
  return (
    <PermissionGate permission="manage_settings">
      <EditSettingsContent />
    </PermissionGate>
  );
}

function EditSettingsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [workspaceName, setWorkspaceName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [instituteType, setInstituteType] = useState<InstituteType>('solo');
  const [admissionFeeLkr, setAdmissionFeeLkr] = useState('0');
  const [proRataEnabled, setProRataEnabled] = useState(true);
  const [minAttendanceForCertificate, setMinAttendanceForCertificate] = useState('75');
  const [requireFeesClearForCertificate, setRequireFeesClearForCertificate] = useState(true);
  const [absenceAlertsEnabled, setAbsenceAlertsEnabled] = useState(true);
  const [absenceAlertTemplate, setAbsenceAlertTemplate] = useState(getDefaultAbsenceAlertTemplate());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const languageLabels = useMemo(
    () =>
      ({
        en: t('settings.english'),
        si: t('settings.sinhala'),
        ta: t('settings.tamil'),
      }) satisfies Record<LanguageCode, string>,
    [t],
  );

  const instituteTypeLabels = useMemo(
    () =>
      ({
        solo: t('settingsEdit.typeSolo'),
        academy: t('settingsEdit.typeAcademy'),
        institute: t('settingsEdit.typeInstitute'),
      }) satisfies Record<InstituteType, string>,
    [t],
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await getCurrentWorkspace();
      setWorkspaceName(workspace?.name ?? '');
      setDefaultLanguage(workspace?.default_language ?? 'en');
      setInstituteType(workspace?.institute_type ?? 'solo');
      setAdmissionFeeLkr(String(workspace?.admission_fee_lkr ?? 0));
      setProRataEnabled(workspace?.pro_rata_enabled ?? true);
      setMinAttendanceForCertificate(String(workspace?.min_attendance_for_certificate ?? 75));
      setRequireFeesClearForCertificate(workspace?.require_fees_clear_for_certificate ?? true);
      setAbsenceAlertsEnabled(workspace?.absence_alerts_enabled ?? true);
      setAbsenceAlertTemplate(workspace?.absence_alert_template ?? getDefaultAbsenceAlertTemplate());
      setDisplayName(
        typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
      );
      setPhone(typeof user?.user_metadata?.phone === 'string' ? user.user_metadata.phone : '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('settingsEdit.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await Promise.all([
        updateWorkspace({
          name: workspaceName,
          defaultLanguage,
          instituteType,
          admissionFeeLkr: Number(admissionFeeLkr.replace(/\D/g, '') || 0),
          proRataEnabled,
          minAttendanceForCertificate: Number(minAttendanceForCertificate.replace(/\D/g, '') || 0),
          requireFeesClearForCertificate,
          absenceAlertsEnabled,
          absenceAlertTemplate,
        }),
        updateTeacherProfile({ fullName: displayName, phone }),
      ]);
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('settingsEdit.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('settingsEdit.title')}</Text>
            <Text style={styles.subtitle}>{t('settingsEdit.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{t('settingsEdit.heroLabel')}</Text>
          <Text style={styles.heroTitle}>{t('settingsEdit.heroTitle')}</Text>
          <Text style={styles.heroNote}>{t('settingsEdit.heroNote')}</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('settingsEdit.instituteTitle')}</Text>
          <FormTextField
            label={t('settingsEdit.instituteNameLabel')}
            placeholder={t('settingsEdit.institutePlaceholder')}
            icon="school-outline"
            value={workspaceName}
            onChangeText={setWorkspaceName}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('settingsEdit.teacherProfileTitle')}</Text>
          <FormTextField
            label={t('settingsEdit.displayNameLabel')}
            placeholder={t('settingsEdit.displayNamePlaceholder')}
            icon="account-outline"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <FormTextField
            label={t('settingsEdit.mobileLabel')}
            placeholder={t('settingsEdit.mobilePlaceholder')}
            icon="phone-outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('settingsEdit.instituteFeesTitle')}</Text>
          <Text style={styles.cardHint}>{t('settingsEdit.instituteFeesHint')}</Text>
          <ChoiceChipGroup
            label={t('settingsEdit.instituteTypeLabel')}
            selected={instituteTypeLabels[instituteType]}
            options={instituteTypeValues.map((value) => instituteTypeLabels[value])}
            onSelect={(label) => {
              const match = instituteTypeValues.find((value) => instituteTypeLabels[value] === label);
              if (match) setInstituteType(match);
            }}
          />
          <FormTextField
            label={t('settingsEdit.admissionFeeLabel')}
            placeholder={t('settingsEdit.admissionPlaceholder')}
            icon="cash-plus"
            keyboardType="number-pad"
            value={admissionFeeLkr}
            onChangeText={setAdmissionFeeLkr}
            helper={t('settingsEdit.admissionHelper')}
          />
          <ChoiceChipGroup
            label={t('settingsEdit.proRataLabel')}
            selected={proRataEnabled ? t('settingsEdit.enabled') : t('settingsEdit.disabled')}
            options={[t('settingsEdit.enabled'), t('settingsEdit.disabled')]}
            onSelect={(label) => setProRataEnabled(label === t('settingsEdit.enabled'))}
          />
          {instituteType !== 'solo' ? (
            <>
              <FormTextField
                label={t('settingsEdit.minAttendanceLabel')}
                placeholder={t('settingsEdit.minAttendancePlaceholder')}
                icon="percent-outline"
                keyboardType="number-pad"
                value={minAttendanceForCertificate}
                onChangeText={setMinAttendanceForCertificate}
                helper={t('settingsEdit.minAttendanceHelper')}
              />
              <ChoiceChipGroup
                label={t('settingsEdit.requireFeesLabel')}
                selected={requireFeesClearForCertificate ? t('settingsEdit.required') : t('settingsEdit.notRequired')}
                options={[t('settingsEdit.required'), t('settingsEdit.notRequired')]}
                onSelect={(label) => setRequireFeesClearForCertificate(label === t('settingsEdit.required'))}
              />
            </>
          ) : null}
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('settingsEdit.absenceTitle')}</Text>
          <Text style={styles.cardHint}>{t('settingsEdit.absenceHint')}</Text>
          <ChoiceChipGroup
            label={t('settingsEdit.absenceAlertsLabel')}
            selected={absenceAlertsEnabled ? t('settingsEdit.enabled') : t('settingsEdit.disabled')}
            options={[t('settingsEdit.enabled'), t('settingsEdit.disabled')]}
            onSelect={(label) => setAbsenceAlertsEnabled(label === t('settingsEdit.enabled'))}
          />
          <FormTextField
            label={t('settingsEdit.absenceTemplateLabel')}
            placeholder={t('settingsEdit.absencePlaceholder')}
            icon="message-alert-outline"
            value={absenceAlertTemplate}
            onChangeText={setAbsenceAlertTemplate}
            multiline
            helper={t('settingsEdit.absenceTemplateHelper')}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('settingsEdit.defaultLanguageTitle')}</Text>
          <ChoiceChipGroup
            label={t('settingsEdit.languageLabel')}
            selected={languageLabels[defaultLanguage]}
            options={languageValues.map((value) => languageLabels[value])}
            onSelect={(label) => {
              const match = languageValues.find((value) => languageLabels[value] === label);
              if (match) setDefaultLanguage(match);
            }}
          />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <Text style={styles.saveNote}>{t('settingsEdit.saveFootnote')}</Text>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>{t('settingsEdit.saveSettings')}</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveNote: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
