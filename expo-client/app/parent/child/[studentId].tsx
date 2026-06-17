import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { clearParentSession, getParentSession } from '@/features/parent/parentAuthService';
import {
  feeStatusLabel,
  formatParentTimelineDate,
  getParentStudentOverview,
  getParentStudentTimeline,
  ParentStudentOverview,
  ParentTimelineItem,
} from '@/features/parent/parentPortalService';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function feeStatusColor(status: ParentStudentOverview['feeStatus']) {
  if (status === 'paid') return colors.success;
  if (status === 'overdue') return colors.danger;
  if (status === 'partial') return colors.warning;
  return colors.info;
}

function attendanceTone(percent: number) {
  if (percent >= 85) return colors.success;
  if (percent >= 70) return colors.warning;
  return colors.danger;
}

export default function ParentChildDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId: string }>();
  const [overview, setOverview] = useState<ParentStudentOverview | null>(null);
  const [timeline, setTimeline] = useState<ParentTimelineItem[]>([]);
  const [childCount, setChildCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backHref = (childCount > 1 ? '/parent' : '/parent/login') as Href;

  const load = useCallback(async () => {
    if (!params.studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const session = await getParentSession();
      if (!session) {
        router.replace('/parent/login');
        return;
      }
      setChildCount(session.children.length);
      const [nextOverview, nextTimeline] = await Promise.all([
        getParentStudentOverview(params.studentId, session.token),
        getParentStudentTimeline(params.studentId, session.token),
      ]);
      setOverview(nextOverview);
      setTimeline(nextTimeline.timeline);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load child dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [params.studentId, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSignOut() {
    await clearParentSession();
    router.replace('/parent/login');
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

  if (error || !overview) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Child record not found.'}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back</Text>
            </Pressable>
          </Link>
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
            <Text style={styles.title}>{overview.studentName}</Text>
            <Text style={styles.subtitle}>
              {overview.workspaceName} • Grade {overview.grade} • {overview.medium}
            </Text>
          </View>
          <Pressable style={styles.iconButton} onPress={handleSignOut}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          </Pressable>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Parent dashboard</Text>
          <Text style={styles.heroTitle}>{overview.studentName}</Text>
          <Text style={styles.heroNote}>Attendance, fees, receipts and certificates in one place.</Text>
        </LinearGradient>

        <View style={styles.summaryRow}>
          <PremiumCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Attendance</Text>
            <Text style={[styles.summaryValue, { color: attendanceTone(overview.attendancePercent) }]}>
              {overview.attendancePercent}%
            </Text>
          </PremiumCard>
          <PremiumCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: feeStatusColor(overview.feeStatus) }]}>
              {formatLkr(overview.outstandingAmount)}
            </Text>
          </PremiumCard>
        </View>

        <PremiumCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: `${feeStatusColor(overview.feeStatus)}1A` }]}>
              <MaterialCommunityIcons name="cash-multiple" size={22} color={feeStatusColor(overview.feeStatus)} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Fee status</Text>
              <Text style={styles.statusValue}>{feeStatusLabel(overview.feeStatus)}</Text>
              <Text style={styles.statusMeta}>Total paid: {formatLkr(overview.paidAmount)}</Text>
            </View>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Text style={styles.cardTitle}>Receipts & certificates</Text>
            <Text style={styles.timelineCount}>{timeline.length}</Text>
          </View>
          {timeline.length === 0 ? (
            <Text style={styles.emptyText}>No receipts or certificates yet.</Text>
          ) : (
            <View style={styles.timelineList}>
              {timeline.map((item) => (
                <TimelineRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </View>
          )}
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineRow({ item }: { item: ParentTimelineItem }) {
  const isReceipt = item.type === 'receipt';
  const tone = isReceipt ? colors.success : colors.primary;
  const icon = isReceipt ? 'receipt-text-check-outline' : 'certificate-outline';

  return (
    <View style={styles.timelineRow}>
      <View style={[styles.timelineIcon, { backgroundColor: `${tone}1A` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={tone} />
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineTitle}>{item.title}</Text>
        <Text style={styles.timelineSubtitle}>
          {isReceipt ? `${formatLkr(item.amount)} • ${item.method.toUpperCase()}` : item.subtitle}
          {item.type === 'certificate' && item.revoked ? ' • Revoked' : ''}
        </Text>
        <Text style={styles.timelineDate}>{formatParentTimelineDate(item.occurredOn)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryCard: { flex: 1, gap: spacing.xs },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  summaryValue: { fontSize: 24, fontWeight: '900' },
  statusCard: { gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  statusValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  statusMeta: { marginTop: 4, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  timelineCard: { gap: spacing.md },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  timelineCount: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  timelineList: { gap: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  timelineIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  timelineCopy: { flex: 1 },
  timelineTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  timelineSubtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  timelineDate: { marginTop: 4, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
