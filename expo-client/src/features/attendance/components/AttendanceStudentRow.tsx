import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { AttendanceStatus, AttendanceStudent } from '../models';

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  present: { label: 'Present', color: colors.success, bg: colors.successSoft, icon: 'check-circle-outline' },
  late: { label: 'Late', color: colors.warning, bg: colors.warningSoft, icon: 'clock-alert-outline' },
  absent: { label: 'Absent', color: colors.danger, bg: colors.dangerSoft, icon: 'close-circle-outline' },
  unmarked: { label: 'Mark', color: colors.primary, bg: colors.primarySoft, icon: 'circle-outline' },
};

type Props = {
  student: AttendanceStudent;
};

export function AttendanceStudentRow({ student }: Props) {
  const status = statusConfig[student.attendanceStatus];

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
      </View>
      <View style={styles.copyBlock}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.meta}>Grade {student.grade} • {student.medium} • {student.lastSeen}</Text>
        <View style={styles.phoneRow}>
          <MaterialCommunityIcons name="phone-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.phone}>{student.parentPhone}</Text>
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
        <MaterialCommunityIcons name={status.icon} size={15} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>
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
