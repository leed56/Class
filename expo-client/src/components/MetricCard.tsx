import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { PremiumCard } from './PremiumCard';

type MetricCardProps = {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: string;
  delta?: string;
};

export function MetricCard({ label, value, icon, tone, delta }: MetricCardProps) {
  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={[styles.iconWrap, { backgroundColor: `${tone}1F` }]}>
          <MaterialCommunityIcons name={icon} size={20} color={tone} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      {delta ? <Text style={[styles.delta, { color: tone }]}>{delta}</Text> : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  delta: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: '800',
  },
});
