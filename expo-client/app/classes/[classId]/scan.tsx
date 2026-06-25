import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  loadAttendanceSheet,
  markStudentPresent,
} from '@/features/attendance/attendanceService';
import { QrScannerPanel } from '@/features/attendance/components/QrScannerPanel';
import { parseStudentQrPayload } from '@/features/attendance/qrAttendance';
import { AttendanceStudent } from '@/features/attendance/models';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type ScanEvent = {
  id: string;
  studentId: string;
  studentName: string;
  at: string;
};

export default function ClassAttendanceScanScreen() {
  return (
    <PermissionGate permission="take_attendance">
      <ClassAttendanceScanContent />
    </PermissionGate>
  );
}

function ClassAttendanceScanContent() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ classId: string; sessionDate?: string }>();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [classLabel, setClassLabel] = useState(t('classScan.classFallback'));
  const [scanCount, setScanCount] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const backHref = (`/classes/${params.classId}/attendance` as Href);
  const rosterIds = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const studentNames = useMemo(
    () => new Map(students.map((student) => [student.id, student.name])),
    [students],
  );

  const attendanceContext = useMemo(() => {
    if (!params.classId || !sessionDate) return undefined;
    return { classId: params.classId, sessionDate };
  }, [params.classId, sessionDate]);

  const load = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sheet, workspace] = await Promise.all([
        loadAttendanceSheet(params.classId, params.sessionDate),
        getCurrentWorkspace(),
      ]);
      setStudents(sheet.students);
      setSessionId(sheet.session.id);
      setSessionDate(sheet.session.session_date);
      setWorkspaceId(workspace?.id ?? '');
      setClassLabel(
        interpolate(t('classScan.classLabel'), {
          subject: sheet.tuitionClass.subject,
          grade: sheet.tuitionClass.grade,
        }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('classScan.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, params.sessionDate, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleScan(rawValue: string) {
    if (!sessionId || !attendanceContext || isMarking) return;

    const payload = parseStudentQrPayload(rawValue);
    if (!payload) {
      setFlash(t('classScan.invalidQr'));
      return;
    }
    if (payload.workspaceId !== workspaceId) {
      setFlash(t('classScan.wrongInstitute'));
      return;
    }
    if (!rosterIds.has(payload.studentId)) {
      setFlash(t('classScan.notEnrolled'));
      return;
    }

    setIsMarking(true);
    setError(null);
    try {
      await markStudentPresent(sessionId, payload.studentId, attendanceContext);
      const studentName = studentNames.get(payload.studentId) ?? t('classScan.studentFallback');
      setStudents((current) =>
        current.map((student) =>
          student.id === payload.studentId ? { ...student, attendanceStatus: 'present' } : student,
        ),
      );
      setScanCount((value) => value + 1);
      setRecentScans((current) => [
        {
          id: `${Date.now()}-${payload.studentId}`,
          studentId: payload.studentId,
          studentName,
          at: new Date().toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit' }),
        },
        ...current,
      ].slice(0, 8));
      setFlash(interpolate(t('classScan.markedPresent'), { name: studentName }));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : t('classScan.markFailed'));
    } finally {
      setIsMarking(false);
      setTimeout(() => setFlash(null), 1500);
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
          <Link href={backHref} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('classScan.title')}</Text>
            <Text style={styles.subtitle}>{interpolate(t('classScan.subtitle'), { classLabel })}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{t('classScan.heroLabel')}</Text>
          <Text style={styles.heroTitle}>{interpolate(t('classScan.heroTitle'), { count: scanCount })}</Text>
          <Text style={styles.heroNote}>{interpolate(t('classScan.heroNote'), { count: students.length })}</Text>
        </LinearGradient>

        {flash ? (
          <View style={styles.flashBanner}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.success} />
            <Text style={styles.flashText}>{flash}</Text>
          </View>
        ) : null}

        <PremiumCard style={styles.scannerCard}>
          <QrScannerPanel onScan={handleScan} onError={setError} />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PremiumCard style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.cardTitle}>{t('classScan.recentScans')}</Text>
            <Text style={styles.recentCount}>{recentScans.length}</Text>
          </View>
          {recentScans.length === 0 ? (
            <Text style={styles.emptyText}>{t('classScan.recentEmpty')}</Text>
          ) : (
            <View style={styles.recentList}>
              {recentScans.map((item) => (
                <View key={item.id} style={styles.recentRow}>
                  <Text style={styles.recentName}>{item.studentName}</Text>
                  <Text style={styles.recentTime}>{item.at}</Text>
                </View>
              ))}
            </View>
          )}
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('classScan.sessionLabel')}</Text>
          <Text style={styles.saveValue}>{interpolate(t('classScan.sessionValue'), { count: scanCount })}</Text>
        </View>
        <Link href={backHref} asChild>
          <Pressable style={styles.doneButton}>
            <Text style={styles.doneButtonText}>{t('classScan.done')}</Text>
          </Pressable>
        </Link>
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
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  flashBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.successSoft, padding: spacing.md },
  flashText: { color: colors.success, fontSize: 13, fontWeight: '900' },
  scannerCard: { gap: spacing.md },
  recentCard: { gap: spacing.md },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  recentCount: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  recentList: { gap: spacing.sm },
  recentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  recentName: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  recentTime: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  doneButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  doneButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
