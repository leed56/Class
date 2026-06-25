import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { TuitionClass } from '@/features/classes/models';
import { interpolate, formatWeekdayName } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type HallSlot = {
  hall: string;
  count: number;
  subjects: string[];
};

export function buildTodayHallSlots(
  classes: TuitionClass[],
  weekday: string,
  hallNotSetLabel = 'Hall not set',
): HallSlot[] {
  const map = new Map<string, HallSlot>();

  for (const item of classes.filter((cls) => cls.day === weekday)) {
    const hall = item.hall || hallNotSetLabel;
    const existing = map.get(hall) ?? { hall, count: 0, subjects: [] };
    existing.count += 1;
    if (!existing.subjects.includes(item.subject)) {
      existing.subjects.push(item.subject);
    }
    map.set(hall, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

type Props = {
  classes: TuitionClass[];
  weekday: string;
};

export function HallOccupancyPanel({ classes, weekday }: Props) {
  const { locale, t } = useI18n();
  const hallNotSet = t('dashboard.hallNotSet');
  const weekdayLabel = formatWeekdayName(locale, weekday);
  const slots = useMemo(
    () => buildTodayHallSlots(classes, weekday, hallNotSet),
    [classes, weekday, hallNotSet],
  );

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('dashboard.hallOccupancyTitle')}</Text>
          <Text style={styles.subtitle}>{t('dashboard.hallOccupancySubtitle')}</Text>
        </View>
        <NavPressable href={'/settings/hall-rent' as Href} style={styles.linkButton}>
          <Text style={styles.linkText}>{t('sidebar.hallRent')}</Text>
        </NavPressable>
      </View>

      {slots.length === 0 ? (
        <Text style={styles.empty}>{interpolate(t('dashboard.hallOccupancyEmpty'), { weekday: weekdayLabel })}</Text>
      ) : (
        <View style={styles.grid}>
          {slots.map((slot) => {
            const subjects = slot.subjects.slice(0, 2).join(', ') + (slot.subjects.length > 2 ? '…' : '');
            const slotMeta =
              slot.count === 1
                ? interpolate(t('dashboard.slotMetaSingle'), { count: slot.count, subjects })
                : interpolate(t('dashboard.slotMetaMulti'), { count: slot.count, subjects });

            return (
              <View key={slot.hall} style={styles.slotCard}>
                <View style={styles.slotIcon}>
                  <MaterialCommunityIcons name="door-open" size={18} color={colors.primary} />
                </View>
                <View style={styles.slotCopy}>
                  <Text style={styles.slotHall} numberOfLines={1}>
                    {slot.hall}
                  </Text>
                  <Text style={styles.slotMeta}>{slotMeta}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{slot.count}</Text>
                </View>
              </View>
            );
          })}
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
    backgroundColor: colors.background,
  },
  linkText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  empty: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  grid: { gap: spacing.sm },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCopy: { flex: 1 },
  slotHall: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  slotMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  badge: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
});
