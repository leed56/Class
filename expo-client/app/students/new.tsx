import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  resolveStudentGradeForSave,
  StudentProfileForm,
} from '@/features/students/components/StudentProfileForm';
import { FormTextField } from '@/features/students/components/FormTextField';
import { createStudent } from '@/features/students/studentService';
import { useI18n } from '@/i18n/I18nProvider';
import { InstituteType, Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function NewStudentScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [academySector, setAcademySector] = useState<string | null>('school_tuition');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('9');
  const [medium, setMedium] = useState<Medium>('English');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [consentCaptured, setConsentCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentWorkspace()
      .then((workspace) => {
        setWorkspaceType(workspace?.institute_type ?? 'solo');
        setAcademySector(workspace?.academy_sector ?? 'school_tuition');
      })
      .catch(() => setWorkspaceType('solo'));
  }, []);

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      await createStudent({
        fullName,
        grade: resolveStudentGradeForSave(workspaceType, academySector, grade),
        medium,
        school,
        parentName,
        parentPhone,
        consentCaptured,
      });
      router.replace('/(tabs)/students');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('studentForm.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/students" asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('studentForm.addTitle')}</Text>
            <Text style={styles.subtitle}>
              {workspaceType === 'academy' && academySector !== 'school_tuition'
                ? t('studentForm.subtitleAcademy')
                : t('studentForm.subtitleSchool')}
            </Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="account-plus" size={28} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('studentForm.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{t('studentForm.heroTitle')}</Text>
            <Text style={styles.heroNote}>{t('studentForm.heroNote')}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('studentForm.studentDetails')}</Text>
          <StudentProfileForm
            workspaceType={workspaceType}
            academySector={academySector}
            fullName={fullName}
            school={school}
            grade={grade}
            medium={medium}
            onFullNameChange={setFullName}
            onSchoolChange={setSchool}
            onGradeChange={setGrade}
            onMediumChange={setMedium}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('studentForm.parentContact')}</Text>
          <FormTextField label={t('studentForm.parentNameLabel')} placeholder={t('studentForm.parentNamePlaceholder')} icon="account-heart-outline" value={parentName} onChangeText={setParentName} />
          <FormTextField label={t('studentForm.parentPhoneLabel')} placeholder={t('studentForm.parentPhonePlaceholder')} icon="phone-outline" keyboardType="phone-pad" value={parentPhone} onChangeText={setParentPhone} />
        </PremiumCard>

        <PremiumCard style={styles.consentCard}>
          <View style={styles.consentRow}>
            <View style={styles.consentIcon}>
              <MaterialCommunityIcons name="shield-check-outline" size={23} color={colors.primary} />
            </View>
            <View style={styles.consentCopy}>
              <Text style={styles.consentTitle}>{t('studentForm.consentTitle')}</Text>
              <Text style={styles.consentText}>{t('studentForm.consentText')}</Text>
            </View>
          </View>
          <Pressable
            style={[styles.consentPill, !consentCaptured && styles.consentPillPending]}
            onPress={() => setConsentCaptured((current) => !current)}
          >
            <MaterialCommunityIcons
              name={consentCaptured ? 'check-circle' : 'checkbox-blank-circle-outline'}
              size={18}
              color={consentCaptured ? colors.success : colors.warning}
            />
            <Text style={[styles.consentPillText, !consentCaptured && styles.consentPillTextPending]}>
              {consentCaptured ? t('studentForm.consentCaptured') : t('studentForm.consentTap')}
            </Text>
          </Pressable>
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('studentForm.profileQuality')}</Text>
          <Text style={styles.saveValue}>{consentCaptured ? t('studentForm.readyToSave') : t('studentForm.consentRequired')}</Text>
        </View>
        <Pressable style={[styles.saveButton, submitting && styles.saveButtonDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>{t('studentForm.saveStudent')}</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { minHeight: 140, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  consentCard: { gap: spacing.lg, borderColor: colors.primarySoft },
  consentRow: { flexDirection: 'row', gap: spacing.md },
  consentIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  consentCopy: { flex: 1 },
  consentTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  consentText: { marginTop: 5, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  consentPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.successSoft },
  consentPillPending: { backgroundColor: colors.warningSoft },
  consentPillText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  consentPillTextPending: { color: colors.warning },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
