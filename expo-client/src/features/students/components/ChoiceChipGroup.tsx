import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  label: string;
  options: string[];
  selected: string;
  onSelect?: (value: string) => void;
};

export function ChoiceChipGroup({ label, options, selected, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              style={[styles.chip, active && styles.activeChip]}
              onPress={() => onSelect?.(option)}
              disabled={!onSelect}
            >
              <Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activeChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
  },
  activeChipText: {
    color: 'white',
  },
});
