import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/MetricCard';
import { PremiumCard } from '@/components/PremiumCard';
import { ClassCard } from '@/features/classes/components/ClassCard';
import { listClasses } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
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

const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function ClassesScreen() {
  const [classes, setClasses] = useState<TuitionClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setIsLoading(true);
    if (mode === 'refresh') setIsRefreshing(true);
    setError(null);

    try {
      const rows = await listClasses();
      setClasses(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load classes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses]),
  );

  const todayClasses = useMemo(() => classes.filter((item) => item.day === todayName), [classes]);
  const nextClass = todayClasses.find((item) => item.state !== 'completed') ?? classes[0];
  const weeklyRevenue = useMemo(() => classes.reduce((sum, item) => sum + item.monthlyFee, 0), [classes]);
  const activeDays = useMemo(() => new Set(classes.map((item) => item.day)).size, [classes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadClasses('refresh')} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Classes</Text>
            <Text style={styles.subtitle}>Create schedules, manage halls, fees and attendance from one polished workspace.</Text>
          </View>
          <Link href="/classes/new" asChild>
            <Pressable style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </Pressable>
          </Link>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="calendar-star" size={29} color="white" />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Today’s teaching plan</Text>
            <Text style={styles.heroValue}>{todayClasses.length} classes today</Text>
            <Text style={styles.heroNote}>
              {nextClass ? `Next: ${nextClass.subject} Grade ${nextClass.grade} • ${nextClass.startTime} • ${nextClass.hall}` : 'Create your first class schedule to unlock attendance and fees.'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <MetricCard label="Active Classes" value={`${classes.length}`} icon="google-classroom" tone={colors.primary} />
          <MetricCard label="Monthly Fees" value={formatLkr(weeklyRevenue)} icon="cash-multiple" tone={colors.success} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Class schedule</Text>
          <Text style={styles.sectionAction}>{activeDays || 0} active days</Text>
        </View>

        <View style={styles.dayTabs}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
            const isActive = day === todayName;
            const hasClasses = classes.some((item) => item.day === day);
            return (
              <View key={day} style={[styles.dayChip, isActive && styles.activeDayChip, hasClasses && !isActive && styles.filledDayChip]}>
                <Text style={[styles.dayChipText, isActive && styles.activeDayChipText]}>{weekdayShortNames[day]}</Text>
              </View>
            );
          })}
        </View>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateTitle}>Loading your class schedule</Text>
            <Text style={styles.stateText}>Preparing the latest Supabase data for this workspace.</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <View style={styles.stateIconDanger}>
              <MaterialCommunityIcons name="cloud-alert-outline" size={28} color={colors.danger} />
            </View>
            <Text style={styles.stateTitle}>Could not load classes</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadClasses()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </PremiumCard>
        ) : classes.length === 0 ? (
          <PremiumCard style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="calendar-plus" size={34} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Build your first premium class</Text>
            <Text style={styles.emptyText}>Add subject, grade, medium, time, hall and monthly fee. This becomes the foundation for enrollment, attendance and payments.</Text>
            <Link href="/classes/new" asChild>
              <Pressable style={styles.emptyButton}>
                <MaterialCommunityIcons name="plus" size={18} color="white" />
                <Text style={styles.emptyButtonText}>Add Class</Text>
              </Pressable>
            </Link>
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {classes.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 32,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 278,
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  hero: {
    minHeight: 138,
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
  heroTextBlock: {
    flex: 1,
  },
  heroLabel: {
    color: '#E7DEFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroValue: {
    marginTop: 4,
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroNote: {
    marginTop: 6,
    color: '#E7DEFF',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  dayTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeDayChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filledDayChip: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.primarySoft,
  },
  dayChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  activeDayChipText: {
    color: 'white',
  },
  list: {
    gap: spacing.md,
  },
  stateCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  stateIconDanger: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.sm,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
});
