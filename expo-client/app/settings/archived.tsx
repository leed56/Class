import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { listArchivedClasses, restoreClass } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { listArchivedStudents, restoreStudent } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type ArchiveTab = 'students' | 'classes';

export default function ArchivedRecordsScreen() {
  return (
    <PermissionGate permission="archive_records">
      <ArchivedRecordsContent />
    </PermissionGate>
  );
}

function ArchivedRecordsContent() {
  const [tab, setTab] = useState<ArchiveTab>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TuitionClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadArchived = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextStudents, nextClasses] = await Promise.all([listArchivedStudents(), listArchivedClasses()]);
      setStudents(nextStudents);
      setClasses(nextClasses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load archived records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadArchived();
    }, [loadArchived]),
  );

  function confirmRestoreStudent(student: Student) {
    Alert.alert(
      'Restore student?',
      `${student.name} will reappear in your active student list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => handleRestoreStudent(student.id) },
      ],
    );
  }

  function confirmRestoreClass(item: TuitionClass) {
    Alert.alert(
      'Restore class?',
      `${item.subject} Grade ${item.grade} will reappear in your class schedule.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => handleRestoreClass(item.id) },
      ],
    );
  }

  async function handleRestoreStudent(studentId: string) {
    setRestoringId(studentId);
    setError(null);
    try {
      await restoreStudent(studentId);
      await loadArchived();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Could not restore student.');
    } finally {
      setRestoringId(null);
    }
  }

  async function handleRestoreClass(classId: string) {
    setRestoringId(classId);
    setError(null);
    try {
      await restoreClass(classId);
      await loadArchived();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Could not restore class.');
    } finally {
      setRestoringId(null);
    }
  }

  const activeCount = tab === 'students' ? students.length : classes.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Archived records</Text>
            <Text style={styles.subtitle}>Hidden students and classes. Restore anytime — history stays saved.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="archive-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Soft-deleted records</Text>
            <Text style={styles.heroTitle}>
              {isLoading ? 'Loading…' : `${students.length + classes.length} archived`}
            </Text>
            <Text style={styles.heroNote}>
              {students.length} students • {classes.length} classes
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabChip, tab === 'students' && styles.tabChipActive]}
            onPress={() => setTab('students')}
          >
            <Text style={[styles.tabChipText, tab === 'students' && styles.tabChipTextActive]}>
              Students ({students.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabChip, tab === 'classes' && styles.tabChipActive]}
            onPress={() => setTab('classes')}
          >
            <Text style={[styles.tabChipText, tab === 'classes' && styles.tabChipTextActive]}>
              Classes ({classes.length})
            </Text>
          </Pressable>
        </View>

        {error ? (
          <PremiumCard style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </PremiumCard>
        ) : null}

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateTitle}>Loading archived records…</Text>
          </PremiumCard>
        ) : tab === 'students' ? (
          activeCount === 0 ? (
            <PremiumCard style={styles.stateCard}>
              <EmptyState
                icon="account-off-outline"
                title="No archived students"
                message="Students you archive from their profile will appear here."
              />
            </PremiumCard>
          ) : (
            <View style={styles.list}>
              {students.map((student) => (
                <PremiumCard key={student.id} style={styles.recordCard}>
                  <View style={styles.recordTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {student.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View style={styles.recordCopy}>
                      <Text style={styles.recordTitle} numberOfLines={1}>
                        {student.name}
                      </Text>
                      <Text style={styles.recordMeta} numberOfLines={1}>
                        Grade {student.grade} • {student.medium} • {student.className}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.restoreButton}
                    onPress={() => confirmRestoreStudent(student)}
                    disabled={restoringId === student.id}
                  >
                    {restoringId === student.id ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="backup-restore" size={16} color="white" />
                        <Text style={styles.restoreButtonText}>Restore</Text>
                      </>
                    )}
                  </Pressable>
                </PremiumCard>
              ))}
            </View>
          )
        ) : activeCount === 0 ? (
          <PremiumCard style={styles.stateCard}>
            <EmptyState
              icon="calendar-remove-outline"
              title="No archived classes"
              message="Classes you archive from class detail will appear here."
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {classes.map((item) => (
              <PremiumCard key={item.id} style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <View style={[styles.avatar, styles.classAvatar]}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.recordCopy}>
                    <Text style={styles.recordTitle} numberOfLines={1}>
                      {item.subject}
                    </Text>
                    <Text style={styles.recordMeta} numberOfLines={1}>
                      Grade {item.grade} • {item.medium} • {item.day} {item.startTime}
                    </Text>
                    <Text style={styles.recordMeta} numberOfLines={1}>
                      {item.hall}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.restoreButton}
                  onPress={() => confirmRestoreClass(item)}
                  disabled={restoringId === item.id}
                >
                  {restoringId === item.id ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="backup-restore" size={16} color="white" />
                      <Text style={styles.restoreButtonText}>Restore</Text>
                    </>
                  )}
                </Pressable>
              </PremiumCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.hero,
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.7 },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tabChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  tabChipTextActive: { color: 'white' },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderColor: colors.dangerSoft },
  errorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  stateCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  stateTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  list: { gap: spacing.md },
  recordCard: { gap: spacing.md },
  recordTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classAvatar: { backgroundColor: colors.primarySoft },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  recordCopy: { flex: 1 },
  recordTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  recordMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  restoreButton: {
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  restoreButtonText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
