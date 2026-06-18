import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type FilterChipProps = {
  label: string;
  active?: boolean;
};

type Props = {
  showSchoolGradeFilters?: boolean;
};

function FilterChip({ label, active = false }: FilterChipProps) {
  return (
    <View style={[styles.chip, active && styles.activeChip]}>
      <Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text>
    </View>
  );
}

export function StudentFilterBar({ showSchoolGradeFilters = true }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          placeholder="Search student, school or parent"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <FilterChip label="All" active />
        {showSchoolGradeFilters ? <FilterChip label="By grade" /> : null}
        <FilterChip label="Pending fees" />
        <FilterChip label="No consent" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  searchBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  chipRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  activeChipText: {
    color: 'white',
  },
});
