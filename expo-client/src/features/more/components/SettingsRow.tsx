import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { MoreSetting } from '../data/moreItems';

type Props = {
  item: MoreSetting;
};

export function SettingsRow({ item }: Props) {
  return (
    <Link href={item.href as never} asChild>
      <Pressable style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${item.color}1F` }]}> 
          <MaterialCommunityIcons name={item.icon} size={21} color={item.color} />
        </View>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
        {item.value ? <Text style={styles.valueText}>{item.value}</Text> : null}
        <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  valueText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
});