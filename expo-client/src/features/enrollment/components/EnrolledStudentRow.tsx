import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '@/components/PremiumCard';
import { FeeStatus } from '@/lib/database.types';
import { Student } from '@/features/students/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type EnrolledStudentRowProps = {
  student: Student;
  monthlyFee: number;
  feeStatus?: FeeStatus;
  onRemove: () => void;
};

const feeStatusConfig: Record<FeeStatus, { label: string; color: string; background: string; dot: string }> = {
  paid: { label: 'Paid', color: colors.success, background: colors.successSoft, dot: colors.success },
  partial: { label: 'Partial', color: colors.warning, background: colors.warningSoft, dot: colors.warning },
  pending: { label: 'Fee pending', color: colors.warning, background: colors.warningSoft, dot: colors.warning },
  overdue: { label: 'Overdue', color: colors.danger, background: colors.dangerSoft, dot: colors.danger },
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function EnrolledStudentRow({ student, monthlyFee, feeStatus = 'pending', onRemove }: EnrolledStudentRowProps) {
  const router = useRouter();

  function confirmRemove() {
    Alert.alert(
      'Remove from class?',
      `${student.name} will stay in your registry but leave this class roster.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ],
    );
  }

  const feeStatusStyle = feeStatusConfig[feeStatus];

  return (
    <PremiumCard style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.mainRow, pressed && styles.pressed]}
        onPress={() => router.push(`/students/${student.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>Grade {student.grade} • {student.medium} • {student.parentPhone}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.footerRow}>
        <View style={styles.feePill}>
          <MaterialCommunityIcons name="cash" size={14} color={colors.primary} />
          <Text style={styles.feeText}>{formatLkr(monthlyFee)}/mo</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: feeStatusStyle.background }]}>
          <View style={[styles.statusDot, { backgroundColor: feeStatusStyle.dot }]} />
          <Text style={[styles.statusText, { color: feeStatusStyle.color }]}>{feeStatusStyle.label}</Text>
        </View>
        <Pressable style={styles.removeButton} onPress={confirmRemove} hitSlop={8}>
          <MaterialCommunityIcons name="account-remove-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, paddingVertical: spacing.md },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.92 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  copy: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  meta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  feeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '900' },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
});
