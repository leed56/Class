import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { AttendanceStudentRow } from '@/features/attendance/components/AttendanceStudentRow';
import {
  cycleStudentAttendance,
  loadAttendanceSheet,
  markAllPresent,
  saveAttendanceSession,
  syncOfflineAttendanceForSession,
} from '@/features/attendance/attendanceService';
import { AttendanceSession, AttendanceStatus, AttendanceStudent } from '@/features/attendance/models';
import { AttendanceSessionRow, Medium } from '@/lib/database.types';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type FilterMode = 'all' | 'unmarked' | 'fees';

export default function ClassAttendanceScreen() {
  return (
    <PermissionGate permission="take_attendance">
      <ClassAttendanceContent />
    </PermissionGate>
  );
}

function ClassAttendanceContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ classId: string; sessionDate?: string }>();
  const [session, setSession] = useState<AttendanceSessionRow | null>(null);
  const [sessionView, setSessionView] = useState<AttendanceSession | null>(null);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const attendanceContext = useMemo(() => {
    if (!params.classId || !session?.session_date) return undefined;
    return { classId: params.classId, sessionDate: session.session_date };
  }, [params.classId, session?.session_date]);

  const loadSheet = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const sheet = await loadAttendanceSheet(params.classId, params.sessionDate);
      setSession(sheet.session);
      setSessionView(sheet.sessionView);
      setStudents(sheet.students);
      setPendingSyncCount(sheet.pendingSyncCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('classAttendance.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, params.sessionDate, t]);

  useFocusEffect(
    useCallback(() => {
      loadSheet();
    }, [loadSheet]),
  );

  const filteredStudents = useMemo(() => {
    if (filter === 'unmarked') return students.filter((student) => student.attendanceStatus === 'unmarked');
    if (filter === 'fees') return students.filter((student) => student.feeStatus !== 'paid');
    return students;
  }, [filter, students]);

  const presentCount = students.filter((item) => item.attendanceStatus === 'present').length;
  const lateCount = students.filter((item) => item.attendanceStatus === 'late').length;
  const absentCount = students.filter((item) => item.attendanceStatus === 'absent').length;
  const markedCount = students.filter((item) => item.attendanceStatus !== 'unmarked').length;
  const completionPercent = students.length ? Math.round((markedCount / students.length) * 100) : 0;
  const isSaved = session?.status === 'saved' || session?.status === 'synced';

  async function handleStatusPress(studentId: string, current: AttendanceStatus) {
    if (!session || !attendanceContext) return;
    try {
      const next = await cycleStudentAttendance(session.id, studentId, current, attendanceContext);
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === studentId ? { ...student, attendanceStatus: next } : student,
        ),
      );
      const sheet = await loadAttendanceSheet(params.classId!, params.sessionDate);
      setPendingSyncCount(sheet.pendingSyncCount);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : t('classAttendance.updateFailed'));
    }
  }

  async function handleBulkPresent() {
    if (!session || students.length === 0 || !attendanceContext) return;
    try {
      await markAllPresent(
        session.id,
        students.map((student) => student.id),
        attendanceContext,
      );
      setStudents((currentStudents) =>
        currentStudents.map((student) => ({ ...student, attendanceStatus: 'present' as AttendanceStatus })),
      );
      const sheet = await loadAttendanceSheet(params.classId!, params.sessionDate);
      setPendingSyncCount(sheet.pendingSyncCount);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : t('classAttendance.bulkFailed'));
    }
  }

  async function handleSync() {
    if (!session || !attendanceContext) return;
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncOfflineAttendanceForSession(
        session.id,
        attendanceContext.classId,
        attendanceContext.sessionDate,
      );
      await loadSheet();
      if (result.failed > 0) {
        setError(interpolate(t('classAttendance.syncPartial'), { synced: result.synced, failed: result.failed }));
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : t('classAttendance.syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSave() {
    if (!session || !attendanceContext) return;
    if (markedCount === 0) {
      Alert.alert(t('classAttendance.saveNothingTitle'), t('classAttendance.saveNothingMessage'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveAttendanceSession(session.id, attendanceContext.classId, attendanceContext.sessionDate);
      setSession((current) => (current ? { ...current, status: 'saved' } : current));
      setPendingSyncCount(0);

      const absentStudents = students.filter((student) => student.attendanceStatus === 'absent');
      const workspace = await getCurrentWorkspace();
      if (absentStudents.length > 0 && workspace?.absence_alerts_enabled) {
        router.replace({
          pathname: '/communications/compose',
          params: {
            flow: 'absence_batch',
            sessionId: session.id,
            classId: attendanceContext.classId,
            sessionDate: attendanceContext.sessionDate,
            studentIds: absentStudents.map((student) => student.id).join(','),
          },
        });
        return;
      }

      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('classAttendance.saveFailed'));
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

  if (error && !sessionView) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Link href={`/classes/${params.classId}` as Href} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('classAttendance.backToClass')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionView) return null;

  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };
  const mediumLabel = mediumLabels[sessionView.medium as Medium] ?? sessionView.medium;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href={`/classes/${params.classId}` as Href} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{params.sessionDate ? t('classAttendance.sessionTitle') : t('classAttendance.title')}</Text>
            <Text style={styles.subtitle}>{interpolate(t('classAttendance.subtitle'), { date: sessionView.date })}</Text>
          </View>
          <View style={styles.headerActions}>
            <Link
              href={
                {
                  pathname: '/classes/[classId]/scan',
                  params: { classId: params.classId, sessionDate: params.sessionDate ?? session?.session_date },
                } as Href
              }
              asChild
            >
              <Pressable style={styles.iconButton}>
                <MaterialCommunityIcons name="qrcode-scan" size={21} color={colors.primary} />
              </Pressable>
            </Link>
            <Link href={`/classes/${params.classId}/attendance-history` as Href} asChild>
              <Pressable style={styles.iconButton}>
                <MaterialCommunityIcons name="history" size={21} color={colors.primary} />
              </Pressable>
            </Link>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{sessionView.date}</Text>
            <Text style={styles.heroTitle}>
              {interpolate(t('classAttendance.gradeSubject'), { subject: sessionView.subject, grade: sessionView.grade })}
            </Text>
            <Text style={styles.heroNote}>
              {interpolate(t('classAttendance.heroMeta'), {
                start: sessionView.startTime,
                end: sessionView.endTime,
                hall: sessionView.hall,
                medium: mediumLabel,
              })}
            </Text>
          </View>
        </LinearGradient>

        {students.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-group-outline"
              title={t('classAttendance.emptyTitle')}
              message={t('classAttendance.emptyMessage')}
              actionLabel={t('classAttendance.emptyAction')}
              actionHref={`/classes/${params.classId}/enroll` as Href}
            />
          </PremiumCard>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <SummaryBox label={t('classAttendance.present')} value={`${presentCount}`} color={colors.success} />
              <SummaryBox label={t('classAttendance.late')} value={`${lateCount}`} color={colors.warning} />
              <SummaryBox label={t('classAttendance.absent')} value={`${absentCount}`} color={colors.danger} />
            </View>

            {pendingSyncCount > 0 ? (
              <PremiumCard style={styles.syncCard}>
                <View style={styles.syncCopy}>
                  <Text style={styles.cardTitle}>{t('classAttendance.offlineQueue')}</Text>
                  <Text style={styles.cardSubtitle}>
                    {pendingSyncCount === 1
                      ? t('classAttendance.offlineQueueSingle')
                      : interpolate(t('classAttendance.offlineQueueMulti'), { count: pendingSyncCount })}
                  </Text>
                </View>
                <Pressable style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} onPress={handleSync} disabled={isSyncing}>
                  {isSyncing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.syncButtonText}>{t('classAttendance.syncNow')}</Text>
                  )}
                </Pressable>
              </PremiumCard>
            ) : null}

            <PremiumCard style={styles.progressCard}>
              <View style={styles.progressTopRow}>
                <View>
                  <Text style={styles.cardTitle}>{t('classAttendance.markingProgress')}</Text>
                  <Text style={styles.cardSubtitle}>
                    {interpolate(t('classAttendance.markedMeta'), { marked: markedCount, total: students.length })}
                  </Text>
                </View>
                <Text style={styles.progressPercent}>{completionPercent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
              </View>
            </PremiumCard>

            <View style={styles.quickRow}>
              <FilterChip label={t('classAttendance.filterAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
              <FilterChip label={t('classAttendance.filterUnmarked')} active={filter === 'unmarked'} onPress={() => setFilter('unmarked')} />
              <FilterChip label={t('classAttendance.filterFees')} active={filter === 'fees'} onPress={() => setFilter('fees')} />
            </View>

            {error ? <Text style={styles.inlineError}>{error}</Text> : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('classAttendance.studentList')}</Text>
              <Pressable onPress={handleBulkPresent}>
                <Text style={styles.sectionAction}>{t('classAttendance.bulkPresent')}</Text>
              </Pressable>
            </View>

            <PremiumCard style={styles.listCard}>
              {filteredStudents.length === 0 ? (
                <Text style={styles.emptyFilter}>{t('classAttendance.emptyFilter')}</Text>
              ) : (
                filteredStudents.map((student, index) => (
                  <View key={student.id}>
                    <AttendanceStudentRow
                      student={student}
                      onStatusPress={() => handleStatusPress(student.id, student.attendanceStatus)}
                    />
                    {index < filteredStudents.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                ))
              )}
            </PremiumCard>
          </>
        )}
      </ScrollView>

      {students.length > 0 ? (
        <View style={styles.saveBar}>
          <View>
            <Text style={styles.saveLabel}>{isSaved ? t('classAttendance.sessionSaved') : t('classAttendance.sessionStatus')}</Text>
            <Text style={styles.saveValue}>
              {interpolate(t('classAttendance.markedFooter'), { marked: markedCount, total: students.length })}
            </Text>
          </View>
          <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
                <Text style={styles.saveButtonText}>{isSaved ? t('classAttendance.update') : t('classAttendance.save')}</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <PremiumCard style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </PremiumCard>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={active ? styles.quickChipActive : styles.quickChip} onPress={onPress}>
      <Text style={active ? styles.quickChipActiveText : styles.quickChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  syncCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderColor: colors.warningSoft },
  syncCopy: { flex: 1 },
  syncButton: { borderRadius: radius.lg, backgroundColor: colors.warning, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  syncButtonDisabled: { opacity: 0.7 },
  syncButtonText: { color: 'white', fontSize: 12, fontWeight: '900' },
  summaryBox: { flex: 1, padding: spacing.lg },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  summaryValue: { marginTop: 5, fontSize: 24, fontWeight: '900' },
  progressCard: { gap: spacing.md },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  progressPercent: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.primarySoft },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.success },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickChip: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  quickChipActive: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.primary },
  quickChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  quickChipActiveText: { color: 'white', fontSize: 12, fontWeight: '900' },
  inlineError: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  listCard: { paddingVertical: spacing.sm },
  emptyFilter: { padding: spacing.lg, color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
