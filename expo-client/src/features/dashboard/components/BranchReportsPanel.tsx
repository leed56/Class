import { Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { BranchMonthlyReport, UNASSIGNED_BRANCH_ID } from '@/features/locations/models';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  monthLabel: string;
  rows: BranchMonthlyReport[];
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function BranchReportsPanel({ monthLabel, rows }: Props) {
  const { t } = useI18n();
  const totalCollected = rows.reduce((sum, row) => sum + row.collected, 0);
  const topBranches = rows.slice(0, 3);

  const branchLabel = (row: BranchMonthlyReport) =>
    row.branchId === UNASSIGNED_BRANCH_ID || !row.branchName
      ? t('branchReports.unassignedLocation')
      : row.branchName;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('branchReports.panelTitle')}</Text>
          <Text style={styles.subtitle}>
            {interpolate(t('branchReports.panelSubtitle'), { month: monthLabel, amount: formatLkr(totalCollected) })}
          </Text>
        </View>
        <NavPressable href={'/reports/branches' as Href} style={styles.linkButton}>
          <Text style={styles.linkText}>{t('branchReports.panelOpen')}</Text>
        </NavPressable>
      </View>

      {topBranches.length === 0 ? (
        <Text style={styles.empty}>{t('branchReports.panelEmpty')}</Text>
      ) : (
        <View style={styles.list}>
          {topBranches.map((row) => (
            <View key={row.branchId} style={styles.row}>
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
              <Text style={styles.amount}>{formatLkr(row.collected)}</Text>
            </View>
          ))}
        </View>
      )}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700', maxWidth: 420 },
  linkButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  empty: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowCopy: { flex: 1 },
  branchName: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  rowMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  amount: { color: colors.success, fontSize: 14, fontWeight: '900' },
});
