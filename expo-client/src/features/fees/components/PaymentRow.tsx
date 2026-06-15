import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { PaymentRecord } from '../models';

type PaymentRowProps = {
  payment: PaymentRecord;
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function PaymentRow({ payment }: PaymentRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="cash-check" size={20} color={colors.success} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{payment.studentName}</Text>
        <Text style={styles.meta} numberOfLines={1}>{payment.className} • {payment.receiptNo}</Text>
      </View>
      <View style={styles.amountBlock}>
        <Text style={styles.amount}>{formatLkr(payment.amount)}</Text>
        <Text style={styles.date}>{payment.paidAt}</Text>
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
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
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
  amountBlock: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  date: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
});
