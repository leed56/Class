import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  label: string;
  placeholder: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad';
  helper?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
};

export function FormTextField({
  label,
  placeholder,
  icon,
  keyboardType = 'default',
  helper,
  value,
  onChangeText,
  secureTextEntry,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
        />
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
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
  field: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
