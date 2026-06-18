import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/MetricCard';
import { DashboardCol, DashboardMetricGrid, DashboardRow, DashboardSection } from '@/components/DashboardGrid';
import { NavPressable } from '@/components/NavPressable';
import { PageContainer } from '@/components/PageContainer';
import { PremiumCard } from '@/components/PremiumCard';
import { QuickActionTile } from '@/components/QuickActionTile';
import { useAuth } from '@/core/auth/AuthProvider';
import { useWorkspaceShell } from '@/core/layout/WorkspaceShellContext';
import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  formatLkrCompact,
  formatTodayDate,
  getTeacherDisplayName,
  getTeacherInitials,
  getTimeGreeting,
} from '@/features/auth/teacherProfile';
import { listClasses } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { formatClassMeta } from '@/features/courses/slCourseModel';
import { HallOccupancyPanel } from '@/features/dashboard/components/HallOccupancyPanel';
import { getFeeSummaryForMonth } from '@/features/fees/feeService';
import { listStudents } from '@/features/students/studentService';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { Href } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { useDesktopShell, instituteType } = useWorkspaceShell();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [classes, setClasses] = useState<TuitionClass[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [collected, setCollected] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [defaulterCount, setDefaulterCount] = useState(0);
  const [averageAttendance, setAverageAttendance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [workspace, nextClasses, students, feeSummary] = await Promise.all([
        getCurrentWorkspace(),
        listClasses(),
        listStudents(),
        getFeeSummaryForMonth(),
      ]);

      setWorkspaceName(workspace?.name ?? null);
      setClasses(nextClasses);
      setStudentCount(students.length);
      setCollected(feeSummary.collected);
      setOutstanding(feeSummary.outstanding);
      setDefaulterCount(feeSummary.defaulterCount);
      setAverageAttendance(
        nextClasses.length
          ? Math.round(nextClasses.reduce((sum, item) => sum + item.attendanceAverage, 0) / nextClasses.length)
          : 0,
      );
    } catch {
      setWorkspaceName(null);
      setClasses([]);
      setStudentCount(0);
      setCollected(0);
      setOutstanding(0);
      setDefaulterCount(0);
      setAverageAttendance(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = useMemo(() => classes.filter((item) => item.day === todayName), [classes, todayName]);
  const nextClass = todayClasses.find((item) => item.state !== 'completed') ?? todayClasses[0] ?? classes[0];
  const teacherName = getTeacherDisplayName(user);
  const teacherInitials = getTeacherInitials(user);
  const isInstituteDesktop = useDesktopShell && instituteType === 'institute';
  const isAcademyDesktop = useDesktopShell && instituteType === 'academy';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, useDesktopShell && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
        <PageContainer>
        <View style={[styles.header, useDesktopShell && styles.headerDesktop]}>
          <View>
            <Text style={[styles.screenTitle, useDesktopShell && styles.screenTitleDesktop]}>
              {isInstituteDesktop ? 'Building dashboard' : isAcademyDesktop ? 'Academy dashboard' : 'Home'}
            </Text>
            <Text style={styles.date}>{formatTodayDate()}</Text>
          </View>
          {!useDesktopShell ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{teacherInitials}</Text>
            </View>
          ) : null}
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, useDesktopShell && styles.heroDesktop]}>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipText}>{workspaceName ?? 'Your workspace'}</Text>
          </View>
          <Text style={[styles.heroTitle, useDesktopShell && styles.heroTitleDesktop]}>
            {getTimeGreeting()},
            {'\n'}
            {teacherName}
          </Text>
          <Text style={styles.heroCopy}>
            {isInstituteDesktop
              ? `Manage halls, visiting teachers and building operations. ${todayClasses.length} class${todayClasses.length === 1 ? '' : 'es'} in halls today.`
              : isAcademyDesktop
                ? `Your academy command centre — ${studentCount} trainee${studentCount === 1 ? '' : 's'}, ${defaulterCount} pending fee${defaulterCount === 1 ? '' : 's'} this month.`
                : todayClasses.length > 0
                  ? `You have ${todayClasses.length} class${todayClasses.length === 1 ? '' : 'es'} today. ${defaulterCount} student${defaulterCount === 1 ? '' : 's'} with pending fees this month.`
                  : studentCount > 0
                    ? `${studentCount} active student${studentCount === 1 ? '' : 's'} in your registry. Create a class schedule to see today's plan.`
                    : 'Start by adding students and creating your first class.'}
          </Text>
        </LinearGradient>

        {isLoading ? (
          <PremiumCard style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </PremiumCard>
        ) : useDesktopShell ? (
          <DashboardSection>
            <DashboardMetricGrid desktop>
              <MetricCard fill label="Classes Today" value={`${todayClasses.length}`} icon="calendar-month" tone={colors.primary} />
              <MetricCard fill label="Attendance" value={`${averageAttendance}%`} icon="trending-up" tone={colors.success} />
              <MetricCard fill label="Pending Fees" value={`${defaulterCount}`} icon="account-alert" tone={colors.danger} />
              <MetricCard fill label="Collected" value={formatLkrCompact(collected)} icon="wallet" tone={colors.success} />
            </DashboardMetricGrid>

            <DashboardRow>
              <DashboardCol flex={3}>
                <PremiumCard style={styles.panelCard}>
                  <Text style={styles.cardTitle}>Next class</Text>
                  {nextClass ? (
                    <>
                      <View style={styles.classRow}>
                        <View style={styles.classIcon}>
                          <MaterialCommunityIcons name="book-open-page-variant" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.classInfo}>
                          <Text style={styles.className}>{nextClass.subject}</Text>
                          <Text style={styles.muted}>
                            {formatClassMeta(nextClass.subject, nextClass.grade, nextClass.medium, instituteType)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                          {nextClass.startTime} - {nextClass.endTime}
                        </Text>
                        <Text style={styles.metaText}>{nextClass.hall}</Text>
                      </View>
                      <View style={styles.primaryButton}>
                        <NavPressable href={`/classes/${nextClass.id}/attendance` as Href} style={styles.primaryButtonInner}>
                          <Text style={styles.primaryButtonText}>Take Attendance</Text>
                        </NavPressable>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.emptyCopy}>Create a class to see your next session here.</Text>
                  )}
                </PremiumCard>
              </DashboardCol>

              <DashboardCol flex={2}>
                <PremiumCard style={styles.panelCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>Fee collection</Text>
                    <Text style={styles.monthChip}>This month</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${collected + outstanding === 0 ? 0 : Math.round((collected / (collected + outstanding)) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.feeRow}>
                    <FeeValue label="Collected" value={formatLkrCompact(collected)} color={colors.success} />
                    <FeeValue label="Outstanding" value={formatLkrCompact(outstanding)} color={colors.danger} />
                  </View>
                </PremiumCard>
              </DashboardCol>
            </DashboardRow>

            <View>
              <Text style={styles.sectionTitle}>Quick actions</Text>
              <View style={styles.quickRowDesktopGrid}>
                <QuickActionTile fill label="Add Student" icon="account-plus" color={colors.primary} href="/students/new" />
                <QuickActionTile fill label="Create Class" icon="plus-box" color={colors.info} href={'/classes/new' as Href} />
                <QuickActionTile fill label="Payment" icon="cash-plus" color={colors.success} href="/fees/record-payment" />
                <QuickActionTile fill label="Reports" icon="chart-box-outline" color={colors.warning} href="/reports" />
              </View>
            </View>

            <PremiumCard style={styles.panelCard}>
              <Text style={styles.cardTitle}>Today&apos;s schedule</Text>
              {todayClasses.length === 0 ? (
                <Text style={styles.emptyCopy}>No classes scheduled for {todayName}.</Text>
              ) : (
                todayClasses.map((item) => (
                  <ScheduleRow
                    key={item.id}
                    time={item.startTime}
                    title={item.subject}
                    meta={formatClassMeta(item.subject, item.grade, item.medium, instituteType)}
                    status={item.state === 'completed' ? 'Completed' : item.state === 'inProgress' ? 'Now' : 'Upcoming'}
                    color={item.state === 'completed' ? colors.success : item.state === 'inProgress' ? colors.primary : colors.warning}
                  />
                ))
              )}
            </PremiumCard>

            {isInstituteDesktop ? <HallOccupancyPanel classes={classes} weekday={todayName} /> : null}
          </DashboardSection>
        ) : (
          <>
            <DashboardMetricGrid>
              <MetricCard label="Classes Today" value={`${todayClasses.length}`} icon="calendar-month" tone={colors.primary} />
              <MetricCard label="Attendance" value={`${averageAttendance}%`} icon="trending-up" tone={colors.success} />
              <MetricCard label="Pending Fees" value={`${defaulterCount}`} icon="account-alert" tone={colors.danger} />
              <MetricCard label="Collected" value={formatLkrCompact(collected)} icon="wallet" tone={colors.success} />
            </DashboardMetricGrid>

            <PremiumCard>
              <Text style={styles.cardTitle}>Next class</Text>
              {nextClass ? (
                <>
                  <View style={styles.classRow}>
                    <View style={styles.classIcon}>
                      <MaterialCommunityIcons name="book-open-page-variant" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{nextClass.subject}</Text>
                      <Text style={styles.muted}>
                        {formatClassMeta(nextClass.subject, nextClass.grade, nextClass.medium, instituteType)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {nextClass.startTime} - {nextClass.endTime}
                    </Text>
                    <Text style={styles.metaText}>{nextClass.hall}</Text>
                  </View>
                  <View style={styles.primaryButton}>
                    <NavPressable href={`/classes/${nextClass.id}/attendance` as Href} style={styles.primaryButtonInner}>
                      <Text style={styles.primaryButtonText}>Take Attendance</Text>
                    </NavPressable>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyCopy}>Create a class to see your next session here.</Text>
              )}
            </PremiumCard>

            <View>
              <Text style={styles.sectionTitle}>Quick actions</Text>
              <View style={styles.quickRow}>
                <QuickActionTile label="Add Student" icon="account-plus" color={colors.primary} href="/students/new" />
                <QuickActionTile label="Create Class" icon="plus-box" color={colors.info} href={'/classes/new' as Href} />
                <QuickActionTile label="Payment" icon="cash-plus" color={colors.success} href="/fees/record-payment" />
                <QuickActionTile label="Reports" icon="chart-box-outline" color={colors.warning} href="/reports" />
              </View>
            </View>

            <PremiumCard>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Fee collection</Text>
                <Text style={styles.monthChip}>This month</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${collected + outstanding === 0 ? 0 : Math.round((collected / (collected + outstanding)) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.feeRow}>
                <FeeValue label="Collected" value={formatLkrCompact(collected)} color={colors.success} />
                <FeeValue label="Outstanding" value={formatLkrCompact(outstanding)} color={colors.danger} />
              </View>
            </PremiumCard>

            <PremiumCard>
              <Text style={styles.cardTitle}>Today&apos;s schedule</Text>
              {todayClasses.length === 0 ? (
                <Text style={styles.emptyCopy}>No classes scheduled for {todayName}.</Text>
              ) : (
                todayClasses.map((item) => (
                  <ScheduleRow
                    key={item.id}
                    time={item.startTime}
                    title={item.subject}
                    meta={formatClassMeta(item.subject, item.grade, item.medium, instituteType)}
                    status={item.state === 'completed' ? 'Completed' : item.state === 'inProgress' ? 'Now' : 'Upcoming'}
                    color={item.state === 'completed' ? colors.success : item.state === 'inProgress' ? colors.primary : colors.warning}
                  />
                ))
              )}
            </PremiumCard>
          </>
        )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeeValue({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.feeValue}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.feeLabel}>{label}</Text>
        <Text style={styles.feeAmount}>{value}</Text>
      </View>
    </View>
  );
}

function ScheduleRow({ time, title, meta, status, color }: { time: string; title: string; meta: string; status: string; color: string }) {
  return (
    <View style={styles.scheduleRow}>
      <Text style={styles.scheduleTime}>{time}</Text>
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleTitle}>{title}</Text>
        <Text style={styles.scheduleMeta}>{meta}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${color}1F` }]}>
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  contentDesktop: { paddingTop: spacing.xxl, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerDesktop: { marginBottom: spacing.sm },
  screenTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  screenTitleDesktop: { fontSize: 34, letterSpacing: -1 },
  date: { marginTop: 4, color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '900' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroDesktop: { padding: spacing.xxxl },
  heroChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  heroChipText: { color: 'white', fontWeight: '800' },
  heroTitle: { marginTop: 18, color: 'white', fontSize: 27, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  heroTitleDesktop: { fontSize: 34, lineHeight: 40 },
  heroCopy: { marginTop: 10, color: '#E7DEFF', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  loadingCard: { alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  panelCard: { flex: 1, alignSelf: 'stretch', minHeight: 260 },
  quickRowDesktopGrid: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionTitle: { marginBottom: spacing.md, color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  classRow: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  classIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  classInfo: { flex: 1 },
  className: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  muted: { marginTop: 4, color: colors.textSecondary, fontWeight: '700' },
  metaRow: { marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: colors.textPrimary, fontWeight: '800' },
  primaryButton: { marginTop: spacing.lg, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, overflow: 'hidden' },
  primaryButtonInner: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '900', fontSize: 15 },
  emptyCopy: { marginTop: spacing.md, color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthChip: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontWeight: '900' },
  progressTrack: { marginTop: spacing.lg, height: 12, borderRadius: 999, backgroundColor: colors.dangerSoft, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.success },
  feeRow: { marginTop: spacing.lg, flexDirection: 'row', gap: spacing.md },
  feeValue: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  feeLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  feeAmount: { marginTop: 3, color: colors.textPrimary, fontWeight: '900' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg },
  scheduleTime: { width: 72, color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { color: colors.textPrimary, fontWeight: '900' },
  scheduleMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '900' },
});
