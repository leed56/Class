import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ScheduleConflict } from '@/features/locations/models';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  conflicts: ScheduleConflict[];
};

export function ScheduleConflictBanner({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="calendar-alert" size={20} color={colors.warning} />
      <View style={styles.copy}>
        <Text style={styles.title}>Hall timetable conflict</Text>
        {conflicts.map((conflict) => (
          <Text key={`${conflict.classId}-${conflict.startTime}`} style={styles.line}>
            {conflict.subject} G{conflict.grade} overlaps {conflict.startTime}–{conflict.endTime} in {conflict.hallLabel}
          </Text>
        ))}
        <Text style={styles.note}>You can still save, but parents may arrive to a double-booked hall.</Text>
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
