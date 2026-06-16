import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { AttendanceStudentRow } from '@/features/attendance/components/AttendanceStudentRow';
import {
  cycleStudentAttendance,
  loadAttendanceSheet,
  markAllPresent,
  saveAttendanceSession,
} from '@/features/attendance/attendanceService';
import { AttendanceSession, AttendanceStatus, AttendanceStudent } from '@/features/attendance/models';
import { AttendanceSessionRow } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type FilterMode = 'all' | 'unmarked' | 'fees';

export default function ClassAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId: string }>();
  const [session, setSession] = useState<AttendanceSessionRow | null>(null);
  const [sessionView, setSessionView] = useState<AttendanceSession | null>(null);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSheet = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const sheet = await loadAttendanceSheet(params.classId);
      setSession(sheet.session);
      setSessionView(sheet.sessionView);
      setStudents(sheet.students);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load attendance.');
    } finally {
      setIsLoading(false);
    }
  }, [params.classId]);

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
    if (!session) return;
    try {
      const next = await cycleStudentAttendance(session.id, studentId, current);
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === studentId ? { ...student, attendanceStatus: next } : student,
        ),
      );
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not update attendance.');
    }
  }

  async function handleBulkPresent() {
    if (!session || students.length === 0) return;
    try {
      await markAllPresent(
        session.id,
        students.map((student) => student.id),
      );
      setStudents((currentStudents) =>
        currentStudents.map((student) => ({ ...student, attendanceStatus: 'present' as AttendanceStatus })),
      );
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Could not mark all present.');
    }
  }

  async function handleSave() {
    if (!session) return;
    if (markedCount === 0) {
      Alert.alert('Nothing to save', 'Mark at least one student before saving this session.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveAttendanceSession(session.id);
      setSession((current) => (current ? { ...current, status: 'saved' } : current));
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save attendance.');
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
              <Text style={styles.retryText}>Back to class</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionView) return null;

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
            <Text style={styles.title}>Take Attendance</Text>
            <Text style={styles.subtitle}>Tap each student to cycle Present → Late → Absent.</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={21} color={colors.textSecondary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{sessionView.date}</Text>
            <Text style={styles.heroTitle}>
              {sessionView.subject} Grade {sessionView.grade}
            </Text>
            <Text style={styles.heroNote}>
              {sessionView.startTime} - {sessionView.endTime} • {sessionView.hall} • {sessionView.medium}
            </Text>
          </View>
        </LinearGradient>

        {students.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-group-outline"
              title="No students enrolled"
              message="Enroll students in this class before taking attendance."
              actionLabel="Enroll Students"
              actionHref={`/classes/${params.classId}/enroll` as Href}
            />
          </PremiumCard>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <SummaryBox label="Present" value={`${presentCount}`} color={colors.success} />
              <SummaryBox label="Late" value={`${lateCount}`} color={colors.warning} />
              <SummaryBox label="Absent" value={`${absentCount}`} color={colors.danger} />
            </View>

            <PremiumCard style={styles.progressCard}>
              <View style={styles.progressTopRow}>
                <View>
                  <Text style={styles.cardTitle}>Marking progress</Text>
                  <Text style={styles.cardSubtitle}>
                    {markedCount} of {students.length} students marked
                  </Text>
                </View>
                <Text style={styles.progressPercent}>{completionPercent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
              </View>
            </PremiumCard>

            <View style={styles.quickRow}>
              <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
              <FilterChip label="Unmarked" active={filter === 'unmarked'} onPress={() => setFilter('unmarked')} />
              <FilterChip label="Fees pending" active={filter === 'fees'} onPress={() => setFilter('fees')} />
            </View>

            {error ? <Text style={styles.inlineError}>{error}</Text> : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Student list</Text>
              <Pressable onPress={handleBulkPresent}>
                <Text style={styles.sectionAction}>Bulk present</Text>
              </Pressable>
            </View>

            <PremiumCard style={styles.listCard}>
              {filteredStudents.length === 0 ? (
                <Text style={styles.emptyFilter}>No students match this filter.</Text>
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
            <Text style={styles.saveLabel}>{isSaved ? 'Session saved' : 'Session status'}</Text>
            <Text style={styles.saveValue}>
              {markedCount}/{students.length} marked
            </Text>
          </View>
          <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
                <Text style={styles.saveButtonText}>{isSaved ? 'Update' : 'Save'}</Text>
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
