import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getClassById } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { EnrollPickerRow } from '@/features/enrollment/components/EnrollPickerRow';
import {
  enrollStudentInClass,
  listAvailableStudentsForClass,
} from '@/features/enrollment/enrollmentService';
import { Student } from '@/features/students/types';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function EnrollStudentsScreenContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ classId: string }>();
  const [tuitionClass, setTuitionClass] = useState<TuitionClass | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };

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
      if (!nextClass) setError(t('classEnroll.classNotFound'));
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'classEnroll.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, t]);

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
      setSuccessMessage(
        interpolate(t('classEnroll.enrollSuccess'), {
          name: enrolled?.name ?? t('classEnroll.studentFallback'),
        }),
      );
      setAvailableStudents((current) => current.filter((student) => student.id !== studentId));
      if (tuitionClass) {
        setTuitionClass({ ...tuitionClass, enrolledCount: tuitionClass.enrolledCount + 1 });
      }
    } catch (enrollError) {
      setError(resolveServiceErrorMessage(enrollError, t, 'classEnroll.enrollFailed'));
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

  const heroMedium = tuitionClass ? mediumLabels[tuitionClass.medium as Medium] ?? tuitionClass.medium : '';

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
            <Text style={styles.title}>{t('classEnroll.title')}</Text>
            <Text style={styles.subtitle}>{t('classEnroll.subtitle')}</Text>
          </View>
        </View>

        {tuitionClass ? (
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
            <Text style={styles.heroLabel}>{t('classEnroll.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{tuitionClass.subject}</Text>
            <Text style={styles.heroNote}>
              {interpolate(t('classEnroll.heroNote'), {
                grade: tuitionClass.grade,
                medium: heroMedium,
                count: tuitionClass.enrolledCount,
              })}
            </Text>
          </LinearGradient>
        ) : null}

        <PremiumCard style={styles.searchCard}>
          <Text style={styles.searchLabel}>{t('classEnroll.searchLabel')}</Text>
          <View style={styles.searchField}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('classEnroll.searchPlaceholder')}
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
          <Text style={styles.sectionTitle}>{t('classEnroll.availableStudents')}</Text>
          <Text style={styles.sectionCount}>{filteredStudents.length}</Text>
        </View>

        {filteredStudents.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-search-outline"
              title={
                availableStudents.length === 0
                  ? t('classEnroll.allEnrolledTitle')
                  : t('classEnroll.noMatchesTitle')
              }
              message={
                availableStudents.length === 0
                  ? t('classEnroll.allEnrolledMessage')
                  : t('classEnroll.noMatchesMessage')
              }
              actionLabel={availableStudents.length === 0 ? t('classEnroll.addNewStudent') : undefined}
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
          <Text style={styles.doneButtonText}>{t('classEnroll.done')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function EnrollStudentsScreen() {
  return (
    <PermissionGate permission="manage_students">
      <EnrollStudentsScreenContent />
    </PermissionGate>
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
