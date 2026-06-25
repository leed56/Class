import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { AttendanceStatus, AttendanceStudent } from '../models';

type Props = {
  student: AttendanceStudent;
  onStatusPress?: () => void;
};

export function AttendanceStudentRow({ student, onStatusPress }: Props) {
  const { t } = useI18n();

  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };
  const medium = mediumLabels[student.medium as Medium] ?? student.medium;

  const statusConfig = useMemo(
    (): Record<AttendanceStatus, { label: string; color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> => ({
      present: { label: t('classAttendance.present'), color: colors.success, bg: colors.successSoft, icon: 'check-circle-outline' },
      late: { label: t('classAttendance.late'), color: colors.warning, bg: colors.warningSoft, icon: 'clock-alert-outline' },
      absent: { label: t('classAttendance.absent'), color: colors.danger, bg: colors.dangerSoft, icon: 'close-circle-outline' },
      unmarked: { label: t('common.markUnmarked'), color: colors.primary, bg: colors.primarySoft, icon: 'circle-outline' },
    }),
    [t],
  );

  const status = statusConfig[student.attendanceStatus];

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
      </View>
      <View style={styles.copyBlock}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.meta}>
          {interpolate(t('common.gradeLastSeenMeta'), {
            grade: student.grade,
            medium,
            lastSeen: student.lastSeen ?? t('common.notSet'),
          })}
        </Text>
        <View style={styles.phoneRow}>
          <MaterialCommunityIcons name="phone-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.phone}>{student.parentPhone}</Text>
        </View>
      </View>
      <Pressable
        style={[styles.statusPill, { backgroundColor: status.bg }]}
        onPress={onStatusPress}
        disabled={!onStatusPress}
      >
        <MaterialCommunityIcons name={status.icon} size={15} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  copyBlock: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  meta: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  phoneRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
