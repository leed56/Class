import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { listClasses } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function AttendancePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string }>();
  const [classes, setClasses] = useState<TuitionClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.classId) {
      router.replace(`/classes/${params.classId}/attendance` as Href);
    }
  }, [params.classId, router]);

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
      if (!params.classId) loadClasses();
    }, [loadClasses, params.classId]),
  );

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = classes.filter((item) => item.day === todayName);
  const otherClasses = classes.filter((item) => item.day !== todayName);

  if (params.classId) {
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Take Attendance</Text>
            <Text style={styles.subtitle}>Choose a class to mark today&apos;s session.</Text>
          </View>
        </View>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading classes...</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadClasses}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </PremiumCard>
        ) : classes.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="calendar-plus"
              title="No classes yet"
              message="Create a class and enroll students before taking attendance."
              actionLabel="Create Class"
              actionHref={'/classes/new' as Href}
            />
          </PremiumCard>
        ) : (
          <>
            {todayClasses.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today&apos;s classes</Text>
                <View style={styles.list}>
                  {todayClasses.map((item) => (
                    <ClassPickRow key={item.id} item={item} featured />
                  ))}
                </View>
              </View>
            ) : null}

            {otherClasses.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{todayClasses.length > 0 ? 'All classes' : 'Your classes'}</Text>
                <View style={styles.list}>
                  {otherClasses.map((item) => (
                    <ClassPickRow key={item.id} item={item} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ClassPickRow({ item, featured = false }: { item: TuitionClass; featured?: boolean }) {
  return (
    <NavPressable href={`/classes/${item.id}/attendance` as Href} style={[styles.pickRow, featured && styles.pickRowFeatured]}>
      <View style={styles.pickIcon}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.pickCopy}>
        <Text style={styles.pickTitle}>
          {item.subject} Grade {item.grade}
        </Text>
        <Text style={styles.pickMeta}>
          {item.day} • {item.startTime} - {item.endTime} • {item.enrolledCount} enrolled
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </NavPressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  stateCard: { alignItems: 'center', gap: spacing.md },
  stateText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  list: { gap: spacing.md },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickRowFeatured: { borderColor: colors.primarySoft, backgroundColor: colors.primarySoft },
  pickIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickCopy: { flex: 1 },
  pickTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  pickMeta: { marginTop: 4, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
