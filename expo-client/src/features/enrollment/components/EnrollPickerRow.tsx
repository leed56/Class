import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumCard } from '@/components/PremiumCard';
import { Student } from '@/features/students/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type EnrollPickerRowProps = {
  student: Student;
  enrolling: boolean;
  onEnroll: () => void;
};

export function EnrollPickerRow({ student, enrolling, onEnroll }: EnrollPickerRowProps) {
  return (
    <PremiumCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>Grade {student.grade} • {student.medium} • {student.school}</Text>
          <Text style={styles.parent} numberOfLines={1}>{student.parentName} • {student.parentPhone}</Text>
        </View>
        <Pressable
          style={[styles.enrollButton, enrolling && styles.enrollButtonDisabled]}
          onPress={onEnroll}
          disabled={enrolling}
        >
          {enrolling ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="account-plus" size={16} color="white" />
              <Text style={styles.enrollText}>Enroll</Text>
            </>
          )}
        </Pressable>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  copy: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  meta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  parent: { marginTop: 2, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  enrollButton: {
    minWidth: 88,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  enrollButtonDisabled: { opacity: 0.7 },
  enrollText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
