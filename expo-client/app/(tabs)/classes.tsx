import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { ClassCard } from '@/features/classes/components/ClassCard';
import { listClasses } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const weekdayShortNames: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export default function ClassesScreen() {
  const [classes, setClasses] = useState<TuitionClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextClasses = await listClasses();
      setClasses(nextClasses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load classes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses]),
  );

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = classes.filter((item) => item.day === todayName);
  const nextClass = todayClasses.find((item) => item.state !== 'completed') ?? classes[0];

  const summary = useMemo(() => {
    const totalStudents = classes.reduce((sum, item) => sum + item.enrolledCount, 0);
    const averageAttendance = classes.length
      ? Math.round(classes.reduce((sum, item) => sum + item.attendanceAverage, 0) / classes.length)
      : 0;
    return { totalStudents, averageAttendance };
  }, [classes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Classes</Text>
            <Text style={styles.subtitle}>Create schedules, manage halls, fees, capacity and attendance.</Text>
          </View>
          <NavPressable href={'/classes/new' as Href} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </NavPressable>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="calendar-star" size={29} color="white" />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Today’s teaching plan</Text>
            <Text style={styles.heroValue}>{todayClasses.length} classes today</Text>
            <Text style={styles.heroNote}>
              {nextClass
                ? `Next: ${nextClass.subject} Grade ${nextClass.grade} • ${nextClass.startTime} • ${nextClass.hall}`
                : 'Create your first class to see today’s schedule.'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <MetricCard label="Active Students" value={`${summary.totalStudents}`} icon="account-group" tone={colors.primary} />
          <MetricCard label="Avg Attendance" value={`${summary.averageAttendance}%`} icon="chart-line" tone={colors.success} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Class schedule</Text>
          <NavPressable href="/settings/archived">
            <Text style={styles.sectionAction}>Archived</Text>
          </NavPressable>
        </View>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateTitle}>Loading classes...</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadClasses}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </PremiumCard>
        ) : classes.length === 0 ? (
          <PremiumCard style={styles.stateCard}>
            <EmptyState
              icon="calendar-plus"
              title="No classes yet"
              message="Create your first recurring class template with schedule and monthly fee."
              actionLabel="Create Class"
              actionHref={'/classes/new' as Href}
            />
          </PremiumCard>
        ) : (
          <>
            <View style={styles.dayTabs}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                const isToday = Object.entries(weekdayShortNames).some(
                  ([full, short]) => short === day && full === todayName,
                );
                return (
                  <View key={day} style={[styles.dayChip, isToday && styles.activeDayChip]}>
                    <Text style={[styles.dayChipText, isToday && styles.activeDayChipText]}>{day}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.list}>
              {classes.map((item) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  detailHref={`/classes/${item.id}` as Href}
                  attendanceHref={`/classes/${item.id}/attendance` as Href}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { maxWidth: 278, marginTop: 4, color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  addButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  hero: { minHeight: 138, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTextBlock: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroValue: { marginTop: 4, color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  dayTabs: { flexDirection: 'row', gap: spacing.sm },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  activeDayChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  activeDayChipText: { color: 'white' },
  list: { gap: spacing.md },
  stateCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  stateTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  errorText: { textAlign: 'center', color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  retryButton: { marginTop: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
