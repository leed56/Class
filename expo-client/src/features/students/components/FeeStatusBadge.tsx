import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { StudentFeeStatus } from '../types';

type FeeStatusBadgeProps = {
  status: StudentFeeStatus;
};

export function FeeStatusBadge({ status }: FeeStatusBadgeProps) {
  const { t } = useI18n();

  const statusConfig = useMemo(
    (): Record<StudentFeeStatus, { label: string; color: string; background: string }> => ({
      paid: { label: t('common.paid'), color: colors.success, background: colors.successSoft },
      partial: { label: t('common.partial'), color: colors.warning, background: colors.warningSoft },
      pending: { label: t('common.pending'), color: colors.danger, background: colors.dangerSoft },
      overdue: { label: t('common.overdue'), color: colors.danger, background: colors.dangerSoft },
    }),
    [t],
  );

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
