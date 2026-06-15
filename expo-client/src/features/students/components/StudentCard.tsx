import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { Student } from '../types';
import { FeeStatusBadge } from './FeeStatusBadge';

type StudentCardProps = {
  student: Student;
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function getTrendColor(percent: number) {
  if (percent >= 90) return colors.success;
  if (percent >= 75) return colors.warning;
  return colors.danger;
}

export function StudentCard({ student }: StudentCardProps) {
  const trendColor = getTrendColor(student.attendancePercent);

  return (
    <Pressable>
      <PremiumCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
            <Text style={styles.meta} numberOfLines={1}>Grade {student.grade} • {student.medium} • {student.school}</Text>
          </View>
          <FeeStatusBadge status={student.feeStatus} />
        </View>

        <View style={styles.classPill}>
          <MaterialCommunityIcons name="school-outline" size={16} color={colors.primary} />
          <Text style={styles.classText} numberOfLines={1}>{student.className}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Attendance</Text>
            <Text style={[styles.statValue, { color: trendColor }]}>{student.attendancePercent}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <Text style={[styles.statValue, { color: student.outstandingAmount > 0 ? colors.danger : colors.success }]}>{formatLkr(student.outstandingAmount)}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.parentRow}>
            <MaterialCommunityIcons name="phone-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.parentText} numberOfLines={1}>{student.parentName} • {student.parentPhone}</Text>
          </View>
          <View style={[styles.consentBadge, { backgroundColor: student.consentCaptured ? colors.successSoft : colors.warningSoft }]}>
            <MaterialCommunityIcons name={student.consentCaptured ? 'shield-check-outline' : 'shield-alert-outline'} size={14} color={student.consentCaptured ? colors.success : colors.warning} />
            <Text style={[styles.consentText, { color: student.consentCaptured ? colors.success : colors.warning }]}>
              {student.consentCaptured ? 'Consent' : 'Need consent'}
            </Text>
          </View>
        </View>
      </PremiumCard>
    </Pressable>
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
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  classText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  bottomRow: {
    gap: spacing.sm,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  parentText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  consentBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  consentText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
