import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ScheduleConflict } from '@/features/locations/models';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  conflicts: ScheduleConflict[];
};

export function ScheduleConflictBanner({ conflicts }: Props) {
  const { t } = useI18n();

  if (conflicts.length === 0) return null;

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="calendar-alert" size={20} color={colors.warning} />
      <View style={styles.copy}>
        <Text style={styles.title}>{t('branches.conflictTitle')}</Text>
        {conflicts.map((conflict) => (
          <Text key={`${conflict.classId}-${conflict.startTime}`} style={styles.line}>
            {interpolate(t('branches.conflictLine'), {
              subject: conflict.subject,
              grade: conflict.grade,
              start: conflict.startTime,
              end: conflict.endTime,
              hall: conflict.hallLabel,
            })}
          </Text>
        ))}
        <Text style={styles.note}>{t('branches.conflictNote')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warningSoft,
    backgroundColor: colors.warningSoft,
    padding: spacing.lg,
  },
  copy: { flex: 1, gap: spacing.xs },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  line: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  note: { marginTop: spacing.xs, color: colors.warning, fontSize: 11, fontWeight: '800' },
});
