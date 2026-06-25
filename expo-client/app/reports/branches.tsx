import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { getBranchMonthlyReports } from '@/features/locations/branchReportsService';
import { BranchReportRow } from '@/features/locations/models';
import { getReportSummary } from '@/features/reports/reportsService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function BranchReportsScreen() {
  const { t } = useI18n();
  const [rows, setRows] = useState<BranchReportRow[]>([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
                    <Text style={styles.branchName}>{row.branchName}</Text>
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
              </View>
            ))}
          </PremiumCard>
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
});
