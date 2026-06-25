import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import {
  AttendanceSessionSummary,
  listClassAttendanceSessions,
} from '@/features/attendance/attendanceService';
import { getClassById } from '@/features/classes/classService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ClassAttendanceHistoryScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ classId: string }>();
  const [classLabel, setClassLabel] = useState('');
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [tuitionClass, nextSessions] = await Promise.all([
        getClassById(params.classId),
        listClassAttendanceSessions(params.classId),
      ]);
      setClassLabel(
        tuitionClass
          ? interpolate(t('attendanceHistory.classLabel'), { subject: tuitionClass.subject, grade: tuitionClass.grade })
          : t('attendanceHistory.classFallback'),
      );
      setSessions(nextSessions);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'attendanceHistory.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, t]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const heroTitle = isLoading
    ? t('attendanceHistory.sessionsLoading')
    : sessions.length === 1
      ? t('attendanceHistory.sessionsSingle')
      : interpolate(t('attendanceHistory.sessionsMulti'), { count: sessions.length });

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
            <Text style={styles.title}>{t('attendanceHistory.title')}</Text>
            <Text style={styles.subtitle}>{t('attendanceHistory.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="calendar-clock" size={28} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{classLabel}</Text>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
            <Text style={styles.heroNote}>{t('attendanceHistory.heroNote')}</Text>
          </View>
        </LinearGradient>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>{t('attendanceHistory.loadingHistory')}</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadHistory}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </PremiumCard>
        ) : sessions.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="clipboard-text-clock-outline"
              title={t('attendanceHistory.emptyTitle')}
              message={t('attendanceHistory.emptyMessage')}
              actionLabel={t('attendanceHistory.emptyAction')}
              actionHref={`/classes/${params.classId}/attendance` as Href}
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {sessions.map((session) => {
              const status =
                session.status === 'saved' || session.status === 'synced'
                  ? t('attendanceHistory.statusSaved')
                  : t('attendanceHistory.statusDraft');
              return (
                <NavPressable
                  key={session.id}
                  href={`/classes/${params.classId}/attendance?sessionDate=${session.sessionDate}` as Href}
                >
                  <PremiumCard style={styles.sessionCard}>
                    <View style={styles.sessionTopRow}>
                      <View style={styles.sessionIcon}>
                        <MaterialCommunityIcons name="calendar-check" size={22} color={colors.primary} />
                      </View>
                      <View style={styles.sessionCopy}>
                        <Text style={styles.sessionDate}>{session.displayDate}</Text>
                        <Text style={styles.sessionMeta}>
                          {interpolate(t('attendanceHistory.sessionMeta'), { count: session.markedCount, status })}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
                    </View>
                    <View style={styles.countRow}>
                      <CountPill label={t('classAttendance.present')} value={session.presentCount} color={colors.success} />
                      <CountPill label={t('classAttendance.late')} value={session.lateCount} color={colors.warning} />
                      <CountPill label={t('classAttendance.absent')} value={session.absentCount} color={colors.danger} />
                    </View>
                  </PremiumCard>
                </NavPressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CountPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.countPill, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.countValue, { color }]}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
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
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
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
  sessionCard: { gap: spacing.lg },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sessionIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  sessionCopy: { flex: 1 },
  sessionDate: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  sessionMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  countRow: { flexDirection: 'row', gap: spacing.sm },
  countPill: { flex: 1, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  countValue: { fontSize: 18, fontWeight: '900' },
  countLabel: { marginTop: 2, color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
});
