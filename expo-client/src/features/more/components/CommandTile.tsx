import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { MoreCommand } from '../data/moreItems';

type CommandTileProps = {
  item: MoreCommand;
};

export function CommandTile({ item }: CommandTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${item.color}1F` }]}>
          <MaterialCommunityIcons name={item.icon} size={23} color={item.color} />
        </View>
        {item.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    minHeight: 156,
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#111827',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  title: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
});
