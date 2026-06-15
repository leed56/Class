import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { StudentFeeStatus } from '../types';

const statusConfig: Record<StudentFeeStatus, { label: string; color: string; background: string }> = {
  paid: { label: 'Paid', color: colors.success, background: colors.successSoft },
  partial: { label: 'Partial', color: colors.warning, background: colors.warningSoft },
  pending: { label: 'Pending', color: colors.danger, background: colors.dangerSoft },
  overdue: { label: 'Overdue', color: colors.danger, background: colors.dangerSoft },
};

type FeeStatusBadgeProps = {
  status: StudentFeeStatus;
};

export function FeeStatusBadge({ status }: FeeStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.background }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '900',
  },
});
