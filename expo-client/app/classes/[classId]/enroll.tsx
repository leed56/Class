import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { getClassById } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { EnrollPickerRow } from '@/features/enrollment/components/EnrollPickerRow';
import {
  enrollStudentInClass,
  listAvailableStudentsForClass,
} from '@/features/enrollment/enrollmentService';
import { Student } from '@/features/students/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function EnrollStudentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId: string }>();
  const [tuitionClass, setTuitionClass] = useState<TuitionClass | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextClass, students] = await Promise.all([
        getClassById(params.classId),
        listAvailableStudentsForClass(params.classId),
      ]);
      setTuitionClass(nextClass);
      setAvailableStudents(students);
      if (!nextClass) setError('Class not found.');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load students.');
    } finally {
      setIsLoading(false);
    }
  }, [params.classId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableStudents;
    return availableStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.school.toLowerCase().includes(query) ||
        student.parentPhone.includes(query),
    );
  }, [availableStudents, search]);

  async function handleEnroll(studentId: string) {
    if (!params.classId) return;
    setEnrollingId(studentId);
    setError(null);
    setSuccessMessage(null);
    try {
      await enrollStudentInClass(params.classId, studentId);
      const enrolled = availableStudents.find((student) => student.id === studentId);
      setSuccessMessage(`${enrolled?.name ?? 'Student'} enrolled successfully.`);
      setAvailableStudents((current) => current.filter((student) => student.id !== studentId));
      if (tuitionClass) {
        setTuitionClass({ ...tuitionClass, enrolledCount: tuitionClass.enrolledCount + 1 });
      }
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : 'Could not enroll student.');
    } finally {
      setEnrollingId(null);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Link href={`/classes/${params.classId}`} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Enroll students</Text>
            <Text style={styles.subtitle}>Add students from your registry into this class roster.</Text>
          </View>
        </View>

        {tuitionClass ? (
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
            <Text style={styles.heroLabel}>Target class</Text>
            <Text style={styles.heroTitle}>{tuitionClass.subject}</Text>
            <Text style={styles.heroNote}>
              Grade {tuitionClass.grade} • {tuitionClass.medium} • {tuitionClass.enrolledCount} already enrolled
            </Text>
          </LinearGradient>
        ) : null}

        <PremiumCard style={styles.searchCard}>
          <Text style={styles.searchLabel}>Search registry</Text>
          <View style={styles.searchField}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Name, school or phone"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
            />
          </View>
        </PremiumCard>

        {successMessage ? (
          <PremiumCard style={styles.successCard}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </PremiumCard>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available students</Text>
          <Text style={styles.sectionCount}>{filteredStudents.length}</Text>
        </View>

        {filteredStudents.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-search-outline"
              title={availableStudents.length === 0 ? 'All students enrolled' : 'No matches found'}
              message={
                availableStudents.length === 0
                  ? 'Every active student is already in this class, or your registry is empty.'
                  : 'Try a different search term.'
              }
              actionLabel={availableStudents.length === 0 ? 'Add New Student' : undefined}
              actionHref={availableStudents.length === 0 ? '/students/new' : undefined}
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {filteredStudents.map((student) => (
              <EnrollPickerRow
                key={student.id}
                student={student}
                enrolling={enrollingId === student.id}
                onEnroll={() => handleEnroll(student.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100, gap: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  searchCard: { gap: spacing.sm },
  searchLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  searchField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderColor: colors.successSoft },
  successText: { flex: 1, color: colors.success, fontSize: 12, fontWeight: '800' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionCount: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  list: { gap: spacing.md },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { color: 'white', fontSize: 15, fontWeight: '900' },
});
