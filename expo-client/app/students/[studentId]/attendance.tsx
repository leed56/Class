import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import {
  listStudentAttendanceHistory,
  StudentAttendanceHistoryEntry,
} from '@/features/attendance/attendanceService';
import { AttendanceStatus } from '@/features/attendance/models';
import { getStudentById } from '@/features/students/studentService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function StudentAttendanceHistoryScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ studentId: string }>();
  const [studentName, setStudentName] = useState(t('studentAttendance.studentFallback'));
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [records, setRecords] = useState<StudentAttendanceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusConfig = useMemo(
    (): Record<
      Exclude<AttendanceStatus, 'unmarked'>,
      { label: string; color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
    > => ({
      present: { label: t('classAttendance.present'), color: colors.success, bg: colors.successSoft, icon: 'check-circle-outline' },
      late: { label: t('classAttendance.late'), color: colors.warning, bg: colors.warningSoft, icon: 'clock-alert-outline' },
      absent: { label: t('classAttendance.absent'), color: colors.danger, bg: colors.dangerSoft, icon: 'close-circle-outline' },
    }),
    [t],
  );

  const loadHistory = useCallback(async () => {
    if (!params.studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [student, nextRecords] = await Promise.all([
        getStudentById(params.studentId),
        listStudentAttendanceHistory(params.studentId),
      ]);
      setStudentName(student?.name ?? t('studentAttendance.studentFallback'));
      setAttendancePercent(student?.attendancePercent ?? 0);
      setRecords(nextRecords);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'studentAttendance.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.studentId, t]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const presentCount = records.filter((record) => record.status === 'present' || record.status === 'late').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href={`/students/${params.studentId}` as Href} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('studentAttendance.title')}</Text>
            <Text style={styles.subtitle}>{t('studentAttendance.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{studentName}</Text>
            <Text style={styles.heroTitle}>
              {interpolate(t('studentAttendance.heroTitle'), { percent: attendancePercent })}
            </Text>
            <Text style={styles.heroNote}>
              {isLoading
                ? t('studentAttendance.heroLoading')
                : interpolate(t('studentAttendance.heroNote'), { present: presentCount, total: records.length })}
            </Text>
          </View>
        </LinearGradient>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>{t('studentAttendance.loadingRecords')}</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadHistory}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </PremiumCard>
        ) : records.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="clipboard-text-clock-outline"
              title={t('studentAttendance.emptyTitle')}
              message={t('studentAttendance.emptyMessage')}
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {records.map((record) => {
              const status = statusConfig[record.status];
              return (
                <PremiumCard key={record.id} style={styles.recordCard}>
                  <View style={styles.recordTopRow}>
                    <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                      <MaterialCommunityIcons name={status.icon} size={20} color={status.color} />
                    </View>
                    <View style={styles.recordCopy}>
                      <Text style={styles.recordDate}>{record.displayDate}</Text>
                      <Text style={styles.recordMeta}>{record.classLabel}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </PremiumCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  stateCard: { alignItems: 'center', gap: spacing.md },
  stateText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
  list: { gap: spacing.md },
  recordCard: { gap: spacing.sm },
  recordTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  recordCopy: { flex: 1 },
  recordDate: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  recordMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusText: { fontSize: 11, fontWeight: '900' },
});
