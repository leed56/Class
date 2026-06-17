import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { archiveClass, getClassById } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { EnrolledStudentRow } from '@/features/enrollment/components/EnrolledStudentRow';
import { ClassRosterEntry, listClassRoster, unenrollStudentFromClass } from '@/features/enrollment/enrollmentService';
import { listInvoicesForMonth } from '@/features/fees/feeService';
import { FeeInvoice } from '@/features/fees/models';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function ClassDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId: string }>();
  const [tuitionClass, setTuitionClass] = useState<TuitionClass | null>(null);
  const [roster, setRoster] = useState<ClassRosterEntry[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClass = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextClass, nextRoster, nextInvoices] = await Promise.all([
        getClassById(params.classId),
        listClassRoster(params.classId),
        listInvoicesForMonth(),
      ]);
      setTuitionClass(nextClass);
      setRoster(nextRoster);
      setInvoices(nextInvoices.filter((invoice) => invoice.classId === params.classId));
      if (!nextClass) setError('Class not found.');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load class.');
    } finally {
      setIsLoading(false);
    }
  }, [params.classId]);

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [loadClass]),
  );

  async function handleUnenroll(studentId: string) {
    if (!params.classId) return;
    try {
      await unenrollStudentFromClass(params.classId, studentId);
      await loadClass();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove student.');
    }
  }

  function confirmArchive() {
    if (!tuitionClass) return;
    Alert.alert(
      'Archive class?',
      `${tuitionClass.subject} G${tuitionClass.grade} will be hidden from active lists. History stays saved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: handleArchive },
      ],
    );
  }

  async function handleArchive() {
    if (!params.classId) return;
    setIsArchiving(true);
    setError(null);
    try {
      await archiveClass(params.classId);
      router.replace('/(tabs)/classes');
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Could not archive class.');
    } finally {
      setIsArchiving(false);
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

  if (error && !tuitionClass) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Class not found.'}</Text>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to classes</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!tuitionClass) return null;

  const capacityPercent = Math.round((tuitionClass.enrolledCount / tuitionClass.capacity) * 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{tuitionClass.subject}</Text>
            <Text style={styles.subtitle}>
              Grade {tuitionClass.grade} • {tuitionClass.medium} • {tuitionClass.day}
            </Text>
          </View>
          <Link href={`/classes/edit/${params.classId}` as Href} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
            </Pressable>
          </Link>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>
                {tuitionClass.startTime} - {tuitionClass.endTime}
              </Text>
              <Text style={styles.heroTitle}>{tuitionClass.hall}</Text>
            </View>
            <View style={styles.rosterBadge}>
              <Text style={styles.rosterBadgeValue}>{tuitionClass.enrolledCount}</Text>
              <Text style={styles.rosterBadgeLabel}>enrolled</Text>
            </View>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${Math.min(capacityPercent, 100)}%` }]} />
          </View>
          <Text style={styles.heroNote}>
            {tuitionClass.enrolledCount}/{tuitionClass.capacity} capacity • {formatLkr(tuitionClass.monthlyFee)} monthly
          </Text>
        </LinearGradient>

        <View style={styles.actionRow}>
          <NavPressable href={`/classes/${params.classId}/attendance-history` as Href} style={styles.secondaryAction}>
            <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
            <Text style={styles.secondaryActionText}>History</Text>
          </NavPressable>
          <NavPressable href={`/classes/${params.classId}/certificates` as Href} style={styles.secondaryAction}>
            <MaterialCommunityIcons name="certificate-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Certificates</Text>
          </NavPressable>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => router.push(`/classes/${params.classId}/enroll` as Href)}
          >
            <MaterialCommunityIcons name="account-multiple-plus" size={18} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Enroll Student</Text>
          </Pressable>
        </View>

        <View style={styles.primaryActionRow}>
          <NavPressable href={`/classes/${params.classId}/attendance` as Href} style={styles.primaryActionFull}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="white" />
            <Text style={styles.primaryActionText}>Take Attendance</Text>
          </NavPressable>
        </View>

        <PremiumCard>
          <Text style={styles.cardTitle}>Class snapshot</Text>
          <View style={styles.statsRow}>
            <Stat label="Roster" value={`${tuitionClass.enrolledCount}`} color={colors.primary} />
            <Stat label="Monthly fee" value={formatLkr(tuitionClass.monthlyFee)} color={colors.textPrimary} />
            <Stat label="Attendance" value={`${tuitionClass.attendanceAverage}%`} color={colors.success} />
            <Stat label="Collected" value={`${tuitionClass.collectionPercent}%`} color={colors.primary} />
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Enrolled students</Text>
          <Pressable onPress={() => router.push(`/classes/${params.classId}/enroll` as Href)}>
            <Text style={styles.sectionAction}>+ Enroll</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        {roster.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-group-outline"
              title="Build your class roster"
              message="Enroll students who already exist in your registry. You can add new students first, then enroll them here."
              actionLabel="Enroll Students"
              actionHref={`/classes/${params.classId}/enroll` as Href}
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {roster.map((entry) => {
              const invoice = invoices.find((item) => item.studentId === entry.student.id);
              return (
                <EnrolledStudentRow
                  key={entry.enrollmentId}
                  student={entry.student}
                  monthlyFee={tuitionClass.monthlyFee}
                  feeStatus={invoice?.status ?? 'pending'}
                  onRemove={() => handleUnenroll(entry.student.id)}
                />
              );
            })}
          </View>
        )}

        <Pressable style={styles.addStudentLink} onPress={() => router.push('/students/new')}>
          <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.primary} />
          <Text style={styles.addStudentText}>Add a new student to registry</Text>
        </Pressable>

        <PremiumCard style={styles.archiveCard}>
          <View style={styles.archiveCopy}>
            <Text style={styles.archiveTitle}>Archive class</Text>
            <Text style={styles.archiveText}>Hide finished or inactive classes without deleting roster, attendance or fee history.</Text>
          </View>
          <Pressable style={[styles.archiveButton, isArchiving && styles.archiveButtonDisabled]} onPress={confirmArchive} disabled={isArchiving}>
            {isArchiving ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="archive-outline" size={18} color={colors.danger} />
                <Text style={styles.archiveButtonText}>Archive</Text>
              </>
            )}
          </Pressable>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden', gap: spacing.md },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  rosterBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.14)' },
  rosterBadgeValue: { color: 'white', fontSize: 22, fontWeight: '900' },
  rosterBadgeLabel: { color: '#E7DEFF', fontSize: 10, fontWeight: '800' },
  heroProgressTrack: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 999, backgroundColor: 'white' },
  heroNote: { color: '#E7DEFF', fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryActionRow: { flexDirection: 'row' },
  primaryActionFull: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryAction: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryActionText: { color: 'white', fontSize: 13, fontWeight: '900' },
  secondaryAction: { flex: 1, minWidth: 104, height: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  secondaryActionText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.background },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  statValue: { marginTop: 4, fontSize: 14, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  inlineError: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  list: { gap: spacing.md },
  addStudentLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  addStudentText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  archiveCard: { gap: spacing.lg, borderColor: colors.dangerSoft },
  archiveCopy: { gap: spacing.xs },
  archiveTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  archiveText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  archiveButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
  archiveButtonDisabled: { opacity: 0.7 },
  archiveButtonText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
