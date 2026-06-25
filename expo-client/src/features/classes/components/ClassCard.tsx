import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { formatLocalizedClassMeta, formatWeekdayName } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { InstituteType, Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { TuitionClass } from '../models';

type ClassCardProps = {
  item: TuitionClass;
  detailHref?: Href;
  attendanceHref?: Href;
  instituteType?: InstituteType | null;
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function ClassCard({ item, detailHref, attendanceHref, instituteType }: ClassCardProps) {
  const router = useRouter();
  const { locale, t } = useI18n();

  const stateConfig = useMemo(
    () => ({
      inProgress: { label: t('common.statusInProgress'), color: colors.primary, background: colors.primarySoft },
      upcoming: { label: t('common.statusUpcoming'), color: colors.warning, background: colors.warningSoft },
      completed: { label: t('common.statusCompleted'), color: colors.success, background: colors.successSoft },
    }),
    [t],
  );

  const medium = item.medium as Medium;

  const status = stateConfig[item.state];
  const capacityPercent = Math.round((item.enrolledCount / item.capacity) * 100);
  const classMeta = formatLocalizedClassMeta(item.subject, item.grade, medium, instituteType, t);

  const cardBody = (
    <>
      <View style={styles.topRow}>
        <View style={styles.subjectIcon}>
          <MaterialCommunityIcons name="book-open-page-variant" size={24} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.meta}>{classMeta}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.scheduleRow}>
        <View style={styles.scheduleItem}>
          <MaterialCommunityIcons name="calendar-clock" size={17} color={colors.textSecondary} />
          <Text style={styles.scheduleText}>{formatWeekdayName(locale, item.day, 'long')}</Text>
        </View>
        <View style={styles.scheduleItem}>
          <MaterialCommunityIcons name="clock-outline" size={17} color={colors.textSecondary} />
          <Text style={styles.scheduleText}>{item.startTime} - {item.endTime}</Text>
        </View>
      </View>

      <View style={styles.scheduleItem}>
        <MaterialCommunityIcons name="map-marker-outline" size={17} color={colors.textSecondary} />
        <Text style={styles.scheduleText}>{item.hall}</Text>
      </View>

      <View style={styles.statsGrid}>
        <Stat label={t('common.studentsLabel')} value={`${item.enrolledCount}/${item.capacity}`} tone={capacityPercent > 85 ? colors.warning : colors.primary} />
        <Stat label={t('common.monthlyFeeLabel')} value={formatLkr(item.monthlyFee)} tone={colors.textPrimary} />
        <Stat label={t('common.attendanceLabel')} value={`${item.attendanceAverage}%`} tone={colors.success} />
        <Stat label={t('common.collectedLabel')} value={`${item.collectionPercent}%`} tone={item.collectionPercent >= 70 ? colors.success : colors.danger} />
      </View>
    </>
  );

  const attendanceButton = attendanceHref ? (
    <NavPressable href={attendanceHref} style={styles.primaryAction}>
      <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="white" />
      <Text style={styles.primaryActionText}>{t('common.takeAttendance')}</Text>
    </NavPressable>
  ) : (
    <View style={styles.primaryAction}>
      <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="white" />
      <Text style={styles.primaryActionText}>{t('common.takeAttendance')}</Text>
    </View>
  );

  return (
    <PremiumCard style={styles.card}>
      {detailHref ? (
        <Pressable
          style={({ pressed }) => [styles.cardBody, pressed && styles.cardBodyPressed]}
          onPress={() => router.push(detailHref)}
        >
          {cardBody}
        </Pressable>
      ) : (
        <View style={styles.cardBody}>{cardBody}</View>
      )}
      {attendanceButton}
    </PremiumCard>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  cardBody: {
    gap: spacing.md,
  },
  cardBodyPressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  subject: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  meta: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scheduleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  statValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '900',
  },
  primaryAction: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
});
