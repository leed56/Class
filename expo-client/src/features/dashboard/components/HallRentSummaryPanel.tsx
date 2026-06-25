import { Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardMetricGrid } from '@/components/DashboardGrid';
import { MetricCard } from '@/components/MetricCard';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { formatLkrCompact } from '@/features/auth/teacherProfile';
import { HallRentSummary } from '@/features/hall-rent/models';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  summary: HallRentSummary;
};

export function HallRentSummaryPanel({ summary }: Props) {
  const { t } = useI18n();
  const collectionPercent =
    summary.totalDue === 0 ? 0 : Math.round((summary.collected / summary.totalDue) * 100);

  const subtitle =
    summary.activeBookings === 1
      ? interpolate(t('dashboard.hallRentPanelSubtitleSingle'), { count: summary.activeBookings })
      : interpolate(t('dashboard.hallRentPanelSubtitleMulti'), { count: summary.activeBookings });

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('dashboard.hallRentPanelTitle')}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <NavPressable href={'/settings/hall-rent' as Href} style={styles.linkButton}>
          <Text style={styles.linkText}>{t('dashboard.openLedger')}</Text>
        </NavPressable>
      </View>

      <DashboardMetricGrid desktop>
        <MetricCard fill label={t('dashboard.collected')} value={formatLkrCompact(summary.collected)} icon="cash-check" tone={colors.success} />
        <MetricCard fill label={t('dashboard.outstanding')} value={formatLkrCompact(summary.outstanding)} icon="cash-remove" tone={colors.danger} />
        <MetricCard fill label={t('dashboard.teachersDue')} value={`${summary.defaulterCount}`} icon="account-alert" tone={colors.warning} />
        <MetricCard fill label={t('dashboard.collection')} value={`${collectionPercent}%`} icon="chart-donut" tone={colors.primary} />
      </DashboardMetricGrid>
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
    backgroundColor: colors.background,
  },
  linkText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
});
