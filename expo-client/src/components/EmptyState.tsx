import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

import { NavPressable } from './NavPressable';

type EmptyStateProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: import('expo-router').Href;
};

export function EmptyState({ icon, title, message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && actionHref ? (
        <NavPressable href={actionHref} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </NavPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.md,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
});
