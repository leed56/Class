import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { archiveClass, getClassById } from '@/features/classes/classService';
import { useWorkspaceRole } from '@/features/auth/useWorkspaceRole';
import { TuitionClass } from '@/features/classes/models';
import { EnrolledStudentRow } from '@/features/enrollment/components/EnrolledStudentRow';
import { ClassRosterEntry, listClassRoster, unenrollStudentFromClass } from '@/features/enrollment/enrollmentService';
import { listInvoicesForMonth } from '@/features/fees/feeService';
import { FeeInvoice } from '@/features/fees/models';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function ClassDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { hasPermission } = useWorkspaceRole();
  const canManageSettings = hasPermission('manage_settings');
  const canManageStudents = hasPermission('manage_students');
  const canTakeAttendance = hasPermission('take_attendance');
  const canIssueCertificates = hasPermission('issue_certificates');
  const canArchiveRecords = hasPermission('archive_records');
  const params = useLocalSearchParams<{ classId: string }>();
  const [tuitionClass, setTuitionClass] = useState<TuitionClass | null>(null);
  const [roster, setRoster] = useState<ClassRosterEntry[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClass = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextClass, nextRoster, nextInvoices] = await Promise.all([
        getClassById(params.classId),
        listClassRoster(params.classId),
        listInvoicesForMonth(),
      ]);
      setTuitionClass(nextClass);
      setRoster(nextRoster);
      setInvoices(nextInvoices.filter((invoice) => invoice.classId === params.classId));
      if (!nextClass) setError(t('classDetail.notFound'));
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'classDetail.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, t]);

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [loadClass]),
  );

  async function handleUnenroll(studentId: string) {
    if (!params.classId) return;
    try {
      await unenrollStudentFromClass(params.classId, studentId);
      await loadClass();
    } catch (removeError) {
      setError(resolveServiceErrorMessage(removeError, t, 'classDetail.removeFailed'));
    }
  }

  function confirmArchive() {
    if (!tuitionClass) return;
    Alert.alert(
      t('classDetail.archiveConfirmTitle'),
      interpolate(t('classDetail.archiveConfirmMessage'), {
        subject: tuitionClass.subject,
        grade: tuitionClass.grade,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('classDetail.archiveButton'), style: 'destructive', onPress: handleArchive },
      ],
    );
  }

  async function handleArchive() {
    if (!params.classId) return;
    setIsArchiving(true);
    setError(null);
    try {
      await archiveClass(params.classId);
      router.replace('/(tabs)/classes');
    } catch (archiveError) {
      setError(resolveServiceErrorMessage(archiveError, t, 'classDetail.archiveFailed'));
    } finally {
      setIsArchiving(false);
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

  if (error && !tuitionClass) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? t('classDetail.notFound')}</Text>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('classDetail.backToClasses')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!tuitionClass) return null;

  const capacityPercent = Math.round((tuitionClass.enrolledCount / tuitionClass.capacity) * 100);
  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{tuitionClass.subject}</Text>
            <Text style={styles.subtitle}>
              {interpolate(t('classDetail.gradeMediumDay'), {
                grade: tuitionClass.grade,
                medium: mediumLabels[tuitionClass.medium],
                day: tuitionClass.day,
              })}
            </Text>
          </View>
          {canManageSettings ? (
            <Link href={`/classes/edit/${params.classId}` as Href} asChild>
              <Pressable style={styles.iconButton}>
                <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
              </Pressable>
            </Link>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>
                {tuitionClass.startTime} - {tuitionClass.endTime}
              </Text>
              <Text style={styles.heroTitle}>{tuitionClass.hall}</Text>
            </View>
            <View style={styles.rosterBadge}>
              <Text style={styles.rosterBadgeValue}>{tuitionClass.enrolledCount}</Text>
              <Text style={styles.rosterBadgeLabel}>{t('classDetail.enrolled')}</Text>
            </View>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${Math.min(capacityPercent, 100)}%` }]} />
          </View>
          <Text style={styles.heroNote}>
            {interpolate(t('classDetail.capacityNote'), {
              enrolled: tuitionClass.enrolledCount,
              capacity: tuitionClass.capacity,
              fee: `${formatLkr(tuitionClass.monthlyFee)} ${t('classDetail.monthlySuffix')}`,
            })}
          </Text>
        </LinearGradient>

        <View style={styles.actionRow}>
          {canTakeAttendance ? (
            <NavPressable href={`/classes/${params.classId}/attendance-history` as Href} style={styles.secondaryAction}>
              <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
              <Text style={styles.secondaryActionText}>{t('classDetail.history')}</Text>
            </NavPressable>
          ) : null}
          {canIssueCertificates ? (
            <NavPressable href={`/classes/${params.classId}/certificates` as Href} style={styles.secondaryAction}>
              <MaterialCommunityIcons name="certificate-outline" size={18} color={colors.primary} />
              <Text style={styles.secondaryActionText}>{t('classDetail.certificates')}</Text>
            </NavPressable>
          ) : null}
          {canManageStudents ? (
            <Pressable
              style={styles.secondaryAction}
              onPress={() => router.push(`/classes/${params.classId}/enroll` as Href)}
            >
              <MaterialCommunityIcons name="account-multiple-plus" size={18} color={colors.primary} />
              <Text style={styles.secondaryActionText}>{t('classDetail.enrollStudent')}</Text>
            </Pressable>
          ) : null}
        </View>

        {canTakeAttendance ? (
        <View style={styles.primaryActionRow}>
          <NavPressable href={`/classes/${params.classId}/attendance` as Href} style={styles.primaryActionFull}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="white" />
            <Text style={styles.primaryActionText}>{t('classDetail.takeAttendance')}</Text>
          </NavPressable>
          <NavPressable href={`/classes/${params.classId}/scan` as Href} style={styles.qrAction}>
            <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.primary} />
            <Text style={styles.qrActionText}>{t('classDetail.qrScan')}</Text>
          </NavPressable>
        </View>
        ) : null}

        <PremiumCard>
          <Text style={styles.cardTitle}>{t('classDetail.snapshotTitle')}</Text>
          <View style={styles.statsRow}>
            <Stat label={t('classDetail.statRoster')} value={`${tuitionClass.enrolledCount}`} color={colors.primary} />
            <Stat label={t('classDetail.statMonthlyFee')} value={formatLkr(tuitionClass.monthlyFee)} color={colors.textPrimary} />
            <Stat label={t('classDetail.statAttendance')} value={`${tuitionClass.attendanceAverage}%`} color={colors.success} />
            <Stat label={t('classDetail.statCollected')} value={`${tuitionClass.collectionPercent}%`} color={colors.primary} />
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('classDetail.enrolledStudents')}</Text>
          {canManageStudents ? (
            <Pressable onPress={() => router.push(`/classes/${params.classId}/enroll` as Href)}>
              <Text style={styles.sectionAction}>{t('classDetail.enrollAction')}</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        {roster.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-group-outline"
              title={t('classDetail.emptyTitle')}
              message={t('classDetail.emptyMessage')}
              actionLabel={t('classDetail.emptyAction')}
              actionHref={canManageStudents ? (`/classes/${params.classId}/enroll` as Href) : undefined}
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {roster.map((entry) => {
              const invoice = invoices.find((item) => item.studentId === entry.student.id);
              return (
                <EnrolledStudentRow
                  key={entry.enrollmentId}
                  student={entry.student}
                  monthlyFee={tuitionClass.monthlyFee}
                  feeStatus={invoice?.status ?? 'pending'}
                  onRemove={canManageStudents ? () => handleUnenroll(entry.student.id) : undefined}
                />
              );
            })}
          </View>
        )}

        {canManageStudents ? (
          <Pressable style={styles.addStudentLink} onPress={() => router.push('/students/new')}>
            <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.primary} />
            <Text style={styles.addStudentText}>{t('classDetail.addStudentLink')}</Text>
          </Pressable>
        ) : null}

        {canArchiveRecords ? (
        <PremiumCard style={styles.archiveCard}>
          <View style={styles.archiveCopy}>
            <Text style={styles.archiveTitle}>{t('classDetail.archiveTitle')}</Text>
            <Text style={styles.archiveText}>{t('classDetail.archiveText')}</Text>
          </View>
          <Pressable style={[styles.archiveButton, isArchiving && styles.archiveButtonDisabled]} onPress={confirmArchive} disabled={isArchiving}>
            {isArchiving ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="archive-outline" size={18} color={colors.danger} />
                <Text style={styles.archiveButtonText}>{t('classDetail.archiveButton')}</Text>
              </>
            )}
          </Pressable>
        </PremiumCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  iconButtonPlaceholder: { width: 46, height: 46 },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden', gap: spacing.md },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  rosterBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.14)' },
  rosterBadgeValue: { color: 'white', fontSize: 22, fontWeight: '900' },
  rosterBadgeLabel: { color: '#E7DEFF', fontSize: 10, fontWeight: '800' },
  heroProgressTrack: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 999, backgroundColor: 'white' },
  heroNote: { color: '#E7DEFF', fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryActionRow: { flexDirection: 'row', gap: spacing.sm },
  primaryActionFull: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  qrAction: { height: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  qrActionText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  primaryAction: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryActionText: { color: 'white', fontSize: 13, fontWeight: '900' },
  secondaryAction: { flex: 1, minWidth: 104, height: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  secondaryActionText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.background },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  statValue: { marginTop: 4, fontSize: 14, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  inlineError: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  list: { gap: spacing.md },
  addStudentLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  addStudentText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  archiveCard: { gap: spacing.lg, borderColor: colors.dangerSoft },
  archiveCopy: { gap: spacing.xs },
  archiveTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  archiveText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  archiveButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
  archiveButtonDisabled: { opacity: 0.7 },
  archiveButtonText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
