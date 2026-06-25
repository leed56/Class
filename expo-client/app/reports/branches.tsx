import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getBranchMonthlyReports } from '@/features/locations/branchReportsService';
import { exportBranchReportCsv } from '@/features/locations/branchReportExport';
import { BranchMonthlyReport, UNASSIGNED_BRANCH_ID, UNASSIGNED_HALL_ID } from '@/features/locations/models';
import { getReportSummary } from '@/features/reports/reportsService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function BranchReportsScreenContent() {
  const { t } = useI18n();
  const [rows, setRows] = useState<BranchMonthlyReport[]>([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summary, branchRows] = await Promise.all([getReportSummary(), getBranchMonthlyReports()]);
      setMonthLabel(summary.monthLabel);
      setRows(branchRows);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'branchReports.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalCollected = rows.reduce((sum, row) => sum + row.collected, 0);

  const branchLabel = (row: BranchMonthlyReport) =>
    row.branchId === UNASSIGNED_BRANCH_ID || !row.branchName
      ? t('branchReports.unassignedLocation')
      : row.branchName;

  const hallLabel = (hallId: string, hallName: string) =>
    hallId === UNASSIGNED_HALL_ID || !hallName ? t('branchReports.unassignedHall') : hallName;

  async function handleExport() {
    if (rows.length === 0) return;
    setIsExporting(true);
    try {
      const exportRows = rows.map((row) => ({
        ...row,
        branchName: branchLabel(row),
        halls: row.halls.map((hall) => ({
          ...hall,
          hallName: hallLabel(hall.hallId, hall.hallName),
        })),
      }));
      await exportBranchReportCsv(monthLabel, exportRows);
    } catch (exportError) {
      Alert.alert(
        t('branchReports.exportFailedTitle'),
        resolveServiceErrorMessage(exportError, t, 'branchReports.exportFailedMessage'),
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/reports" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('branchReports.title')}</Text>
            <Text style={styles.subtitle}>{t('branchReports.subtitle')}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={handleExport} disabled={isLoading || isExporting || rows.length === 0}>
            {isExporting ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <MaterialCommunityIcons name="download-outline" size={22} color={colors.primary} />
            )}
          </Pressable>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{monthLabel}</Text>
          <Text style={styles.heroTitle}>{interpolate(t('branchReports.collectedHero'), { amount: formatLkr(totalCollected) })}</Text>
          <Text style={styles.heroNote}>
            {rows.length === 1
              ? t('branchReports.branchCountSingle')
              : interpolate(t('branchReports.branchCountMulti'), { count: rows.length })}
          </Text>
        </LinearGradient>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>{t('branchReports.loading')}</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </PremiumCard>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="source-branch"
            title={t('branchReports.emptyTitle')}
            message={t('branchReports.emptyMessage')}
            actionLabel={t('branchReports.emptyAction')}
            actionHref="/settings/branches"
          />
        ) : (
          <PremiumCard style={styles.tableCard}>
            <Text style={styles.cardTitle}>{t('branchReports.snapshotTitle')}</Text>
            {rows.map((row, index) => (
              <View key={row.branchId}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.branchName}>{branchLabel(row)}</Text>
                    <Text style={styles.rowMeta}>
                      {interpolate(t('branchReports.rowMeta'), {
                        classes: row.classCount,
                        attendance: row.attendancePercent,
                        collection: row.collectionPercent,
                      })}
                    </Text>
                  </View>
                  <View style={styles.amountBlock}>
                    <Text style={styles.amount}>{formatLkr(row.collected)}</Text>
                    <Text style={styles.due}>{interpolate(t('branchReports.due'), { amount: formatLkr(row.outstanding) })}</Text>
                  </View>
                </View>
                {row.halls.length > 1 || (row.halls.length === 1 && row.halls[0].hallId !== UNASSIGNED_HALL_ID) ? (
                  <View style={styles.hallList}>
                    {row.halls.map((hall) => (
                      <View key={hall.hallId} style={styles.hallRow}>
                        <View style={styles.hallCopy}>
                          <Text style={styles.hallName}>{hallLabel(hall.hallId, hall.hallName)}</Text>
                          <Text style={styles.hallMeta}>
                            {interpolate(t('branchReports.hallMeta'), {
                              classes: hall.classCount,
                              attendance: hall.attendancePercent,
                              collection: hall.collectionPercent,
                            })}
                          </Text>
                        </View>
                        <Text style={styles.hallAmount}>{formatLkr(hall.collected)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </PremiumCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function BranchReportsScreen() {
  return (
    <PermissionGate permission="view_reports">
      <BranchReportsScreenContent />
    </PermissionGate>
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
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  stateCard: { alignItems: 'center', gap: spacing.md },
  stateText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
  tableCard: { gap: spacing.sm },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowCopy: { flex: 1 },
  branchName: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  rowMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  amountBlock: { alignItems: 'flex-end' },
  amount: { color: colors.success, fontSize: 14, fontWeight: '900' },
  due: { marginTop: 2, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
  hallList: { marginLeft: spacing.md, marginBottom: spacing.sm, gap: spacing.xs, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: spacing.md },
  hallRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  hallCopy: { flex: 1 },
  hallName: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  hallMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  hallAmount: { color: colors.success, fontSize: 12, fontWeight: '900' },
});
