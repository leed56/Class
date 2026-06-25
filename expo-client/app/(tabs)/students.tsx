import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { useWorkspaceRole } from '@/features/auth/useWorkspaceRole';
import { StudentCard } from '@/features/students/components/StudentCard';
import { StudentFilterBar } from '@/features/students/components/StudentFilterBar';
import { usesSchoolStudentFields } from '@/features/students/studentProfileModel';
import { listStudents } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function StudentsScreen() {
  const { t } = useI18n();
  const { hasPermission } = useWorkspaceRole();
  const canManageStudents = hasPermission('manage_students');
  const canArchiveRecords = hasPermission('archive_records');
  const [students, setStudents] = useState<Student[]>([]);
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [academySector, setAcademySector] = useState<string | null>('school_tuition');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextStudents, workspace] = await Promise.all([listStudents(), getCurrentWorkspace()]);
      setStudents(nextStudents);
      setWorkspaceType(workspace?.institute_type ?? 'solo');
      setAcademySector(workspace?.academy_sector ?? 'school_tuition');
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'students.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [loadStudents]),
  );

  const showSchoolGradeFilters = usesSchoolStudentFields(workspaceType, academySector);

  const summary = useMemo(() => {
    const totalOutstanding = students.reduce((sum, student) => sum + student.outstandingAmount, 0);
    const pendingCount = students.filter((student) => student.outstandingAmount > 0).length;
    const consentMissingCount = students.filter((student) => !student.consentCaptured).length;
    const averageAttendance = students.length
      ? Math.round(students.reduce((sum, student) => sum + student.attendancePercent, 0) / students.length)
      : 0;

    return { totalOutstanding, pendingCount, consentMissingCount, averageAttendance };
  }, [students]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('students.title')}</Text>
            <Text style={styles.subtitle}>{t('students.subtitle')}</Text>
          </View>
          {canManageStudents ? (
            <NavPressable href="/students/new" style={styles.addButton}>
              <MaterialCommunityIcons name="account-plus" size={22} color="white" />
            </NavPressable>
          ) : (
            <View style={styles.addButtonPlaceholder} />
          )}
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="account-school" size={28} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('students.registryLabel')}</Text>
            <Text style={styles.heroValue}>{interpolate(t('students.studentCount'), { count: students.length })}</Text>
            <Text style={styles.heroNote}>
              {interpolate(t('students.heroNote'), {
                fees: summary.pendingCount,
                consent: summary.consentMissingCount,
              })}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <MetricCard label={t('students.avgAttendance')} value={`${summary.averageAttendance}%`} icon="chart-line" tone={colors.success} />
          <MetricCard label={t('students.outstanding')} value={formatLkr(summary.totalOutstanding)} icon="account-alert" tone={colors.danger} />
        </View>

        <PremiumCard style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <MaterialCommunityIcons name="whatsapp" size={22} color={colors.success} />
          </View>
          <View style={styles.insightTextBlock}>
            <Text style={styles.insightTitle}>{t('students.insightTitle')}</Text>
            <Text style={styles.insightCopy}>{t('students.insightCopy')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </PremiumCard>

        <StudentFilterBar showSchoolGradeFilters={showSchoolGradeFilters} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('students.recentStudents')}</Text>
          {canArchiveRecords ? (
            <NavPressable href="/settings/archived">
              <Text style={styles.sectionAction}>{t('common.archived')}</Text>
            </NavPressable>
          ) : null}
        </View>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateTitle}>{t('students.loading')}</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadStudents}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </PremiumCard>
        ) : students.length === 0 ? (
          <PremiumCard style={styles.stateCard}>
            <EmptyState
              icon="account-plus-outline"
              title={t('students.emptyTitle')}
              message={t('students.emptyMessage')}
              actionLabel={t('common.addStudent')}
              actionHref={canManageStudents ? '/students/new' : undefined}
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                href={`/students/${student.id}`}
                workspaceType={workspaceType}
                academySector={academySector}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { maxWidth: 270, marginTop: 4, color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  addButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  addButtonPlaceholder: { width: 48, height: 48 },
  hero: { minHeight: 138, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroValue: { marginTop: 4, color: 'white', fontSize: 29, fontWeight: '900', letterSpacing: -0.9 },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: spacing.md },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.successSoft },
  insightIcon: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  insightTextBlock: { flex: 1 },
  insightTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  insightCopy: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  list: { gap: spacing.md },
  stateCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  stateTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  errorText: { textAlign: 'center', color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  retryButton: { marginTop: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
