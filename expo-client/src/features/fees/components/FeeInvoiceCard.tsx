import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { FeeInvoice, FeeStatus } from '../models';

const statusConfig: Record<FeeStatus, { label: string; color: string; background: string }> = {
  paid: { label: 'Paid', color: colors.success, background: colors.successSoft },
  partial: { label: 'Partial', color: colors.warning, background: colors.warningSoft },
  pending: { label: 'Pending', color: colors.danger, background: colors.dangerSoft },
  overdue: { label: 'Overdue', color: colors.danger, background: colors.dangerSoft },
};

type FeeInvoiceCardProps = {
  invoice: FeeInvoice;
  onRemind?: () => void;
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function FeeInvoiceCard({ invoice, onRemind }: FeeInvoiceCardProps) {
  const status = statusConfig[invoice.status];
  const progress = invoice.monthlyFee === 0 ? 0 : Math.min(invoice.paidAmount / invoice.monthlyFee, 1);

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{invoice.studentName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{invoice.studentName}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {invoice.invoiceType === 'admission'
              ? `Admission • Grade ${invoice.grade} • ${invoice.medium}`
              : `Grade ${invoice.grade} • ${invoice.medium} • ${invoice.className}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>Outstanding</Text>
          <Text style={[styles.amountValue, { color: invoice.outstandingAmount > 0 ? colors.danger : colors.success }]}>{formatLkr(invoice.outstandingAmount)}</Text>
        </View>
        <View style={styles.monthPill}>
          <MaterialCommunityIcons name="calendar-month" size={15} color={colors.primary} />
          <Text style={styles.monthText}>{invoice.month}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.parentRow}>
          <MaterialCommunityIcons name="phone-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.parentText}>{invoice.parentPhone}</Text>
        </View>
        {invoice.outstandingAmount > 0 ? (
          <Pressable style={styles.reminderButton} onPress={onRemind}>
            <MaterialCommunityIcons name="whatsapp" size={15} color={colors.success} />
            <Text style={styles.reminderText}>Remind</Text>
          </Pressable>
        ) : (
          <View style={styles.receiptButton}>
            <MaterialCommunityIcons name="receipt-text-check-outline" size={15} color={colors.success} />
            <Text style={styles.receiptText}>Receipt</Text>
          </View>
        )}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  meta: {
    marginTop: 3,
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
    fontSize: 11,
    fontWeight: '900',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amountLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  amountValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.primarySoft,
  },
  monthText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.dangerSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.success,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  parentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  parentText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.successSoft,
  },
  reminderText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.successSoft,
  },
  receiptText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
  },
});
