import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type QuickActionTileProps = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  href?: Href;
  onPress?: () => void;
  fill?: boolean;
};

export function QuickActionTile({ label, icon, color, href, onPress, fill }: QuickActionTileProps) {
  const tileStyle = fill ? styles.tileFilled : styles.tile;
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable style={tileStyle}>{content}</Pressable>
      </Link>
    );
  }

  return (
    <Pressable style={tileStyle} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
  },
  tileFilled: {
    flex: 1,
    minWidth: 0,
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
