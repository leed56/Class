import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  loadAttendanceSheet,
  markStudentPresent,
} from '@/features/attendance/attendanceService';
import { QrScannerPanel } from '@/features/attendance/components/QrScannerPanel';
import { parseStudentQrPayload } from '@/features/attendance/qrAttendance';
import { AttendanceStudent } from '@/features/attendance/models';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type ScanEvent = {
  id: string;
  studentId: string;
  studentName: string;
  at: string;
};

export default function ClassAttendanceScanScreen() {
  const params = useLocalSearchParams<{ classId: string; sessionDate?: string }>();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [classLabel, setClassLabel] = useState('Class');
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
      setClassLabel(`${sheet.tuitionClass.subject} Grade ${sheet.tuitionClass.grade}`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load scanner session.');
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, params.sessionDate]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleScan(rawValue: string) {
    if (!sessionId || !attendanceContext || isMarking) return;

    const payload = parseStudentQrPayload(rawValue);
    if (!payload) {
      setFlash('Invalid QR code');
      return;
    }
    if (payload.workspaceId !== workspaceId) {
      setFlash('QR card is from another institute');
      return;
    }
    if (!rosterIds.has(payload.studentId)) {
      setFlash('Student is not enrolled in this class');
      return;
    }

    setIsMarking(true);
    setError(null);
    try {
      await markStudentPresent(sessionId, payload.studentId, attendanceContext);
      const studentName = studentNames.get(payload.studentId) ?? 'Student';
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
      setFlash(`${studentName} marked present`);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not mark attendance.');
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
            <Text style={styles.title}>QR check-in</Text>
            <Text style={styles.subtitle}>Scan student cards to mark present for {classLabel}.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Fast attendance</Text>
          <Text style={styles.heroTitle}>{scanCount} scanned</Text>
          <Text style={styles.heroNote}>{students.length} students in today&apos;s roster</Text>
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
            <Text style={styles.cardTitle}>Recent scans</Text>
            <Text style={styles.recentCount}>{recentScans.length}</Text>
          </View>
          {recentScans.length === 0 ? (
            <Text style={styles.emptyText}>Scanned students will appear here.</Text>
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
          <Text style={styles.saveLabel}>QR session</Text>
          <Text style={styles.saveValue}>{scanCount} present via scan</Text>
        </View>
        <Link href={backHref} asChild>
          <Pressable style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
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
