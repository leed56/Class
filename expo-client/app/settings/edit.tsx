import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { LanguageCode, InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const languageOptions: { label: string; value: LanguageCode }[] = [
  { label: 'English', value: 'en' },
  { label: 'සිංහල', value: 'si' },
  { label: 'தமிழ்', value: 'ta' },
];

function getLanguageLabel(value: LanguageCode) {
  return languageOptions.find((option) => option.value === value)?.label ?? 'English';
}

const instituteTypeOptions: { label: string; value: InstituteType }[] = [
  { label: 'Solo tutor', value: 'solo' },
  { label: 'Academy', value: 'academy' },
  { label: 'Tuition building', value: 'institute' },
];

function getInstituteTypeLabel(value: InstituteType) {
  return instituteTypeOptions.find((option) => option.value === value)?.label ?? 'Solo tutor';
}

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
      setError(loadError instanceof Error ? loadError.message : 'Could not load settings.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
      setError(saveError instanceof Error ? saveError.message : 'Could not save settings.');
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
            <Text style={styles.title}>Edit Settings</Text>
            <Text style={styles.subtitle}>Update institute name, teacher profile and default language.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Workspace settings</Text>
          <Text style={styles.heroTitle}>Keep your institute details current</Text>
          <Text style={styles.heroNote}>Used on receipts, reports, WhatsApp messages and the home dashboard.</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Institute</Text>
          <FormTextField
            label="Institute name"
            placeholder="Your Classes"
            icon="school-outline"
            value={workspaceName}
            onChangeText={setWorkspaceName}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Teacher profile</Text>
          <FormTextField
            label="Display name"
            placeholder="Your name"
            icon="account-outline"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <FormTextField
            label="Mobile number"
            placeholder="+94 77 123 4567"
            icon="phone-outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Institute type & fees</Text>
          <Text style={styles.cardHint}>
            Academies can charge a one-time admission fee. Pro-rata applies half-month rules for mid-month enrollments.
          </Text>
          <ChoiceChipGroup
            label="Institute type"
            selected={getInstituteTypeLabel(instituteType)}
            options={instituteTypeOptions.map((option) => option.label)}
            onSelect={(label) => {
              const match = instituteTypeOptions.find((option) => option.label === label);
              if (match) setInstituteType(match.value);
            }}
          />
          <FormTextField
            label="Admission fee (LKR)"
            placeholder="0"
            icon="cash-plus"
            keyboardType="number-pad"
            value={admissionFeeLkr}
            onChangeText={setAdmissionFeeLkr}
            helper="One-time per student. Set 0 for solo tutors with no registration fee."
          />
          <ChoiceChipGroup
            label="Mid-month pro-rata"
            selected={proRataEnabled ? 'Enabled' : 'Disabled'}
            options={['Enabled', 'Disabled']}
            onSelect={(label) => setProRataEnabled(label === 'Enabled')}
          />
          {instituteType !== 'solo' ? (
            <>
              <FormTextField
                label="Minimum attendance for certificates (%)"
                placeholder="75"
                icon="percent-outline"
                keyboardType="number-pad"
                value={minAttendanceForCertificate}
                onChangeText={setMinAttendanceForCertificate}
                helper="Students below this threshold are blocked from certification."
              />
              <ChoiceChipGroup
                label="Require all fees cleared for certificates"
                selected={requireFeesClearForCertificate ? 'Required' : 'Not required'}
                options={['Required', 'Not required']}
                onSelect={(label) => setRequireFeesClearForCertificate(label === 'Required')}
              />
            </>
          ) : null}
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Absence alerts</Text>
          <Text style={styles.cardHint}>
            After saving attendance, open the message composer for absent students and send same-day parent WhatsApp alerts.
          </Text>
          <ChoiceChipGroup
            label="Same-day absence alerts"
            selected={absenceAlertsEnabled ? 'Enabled' : 'Disabled'}
            options={['Enabled', 'Disabled']}
            onSelect={(label) => setAbsenceAlertsEnabled(label === 'Enabled')}
          />
          <FormTextField
            label="Absence alert template"
            placeholder="Dear parent..."
            icon="message-alert-outline"
            value={absenceAlertTemplate}
            onChangeText={setAbsenceAlertTemplate}
            multiline
            helper="Placeholders: {{student_name}}, {{class_name}}, {{session_date}}, {{workspace_name}}"
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Default language</Text>
          <ChoiceChipGroup
            label="Language"
            selected={getLanguageLabel(defaultLanguage)}
            options={languageOptions.map((option) => option.label)}
            onSelect={(label) => {
              const match = languageOptions.find((option) => option.label === label);
              if (match) setDefaultLanguage(match.value);
            }}
          />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <Text style={styles.saveNote}>Changes apply across your workspace</Text>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
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
