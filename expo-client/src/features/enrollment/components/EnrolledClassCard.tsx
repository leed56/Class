import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TuitionClass } from '@/features/classes/models';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type EnrolledClassCardProps = {
  tuitionClass: TuitionClass;
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function EnrolledClassCard({ tuitionClass }: EnrolledClassCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/classes/${tuitionClass.id}` as Href)}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.subject}>{tuitionClass.subject}</Text>
        <Text style={styles.meta}>
          Grade {tuitionClass.grade} • {tuitionClass.medium} • {tuitionClass.day}
        </Text>
        <Text style={styles.schedule}>
          {tuitionClass.startTime} - {tuitionClass.endTime} • {formatLkr(tuitionClass.monthlyFee)}/mo
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.94 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  subject: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  meta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  schedule: { marginTop: 4, color: colors.primary, fontSize: 11, fontWeight: '800' },
});
