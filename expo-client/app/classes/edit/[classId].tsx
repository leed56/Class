import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getClassById, updateClass } from '@/features/classes/classService';
import { HallPicker } from '@/features/locations/components/HallPicker';
import { ScheduleConflictBanner } from '@/features/locations/components/ScheduleConflictBanner';
import { ScheduleConflict } from '@/features/locations/models';
import { findHallScheduleConflicts } from '@/features/locations/timetableService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function EditClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId: string }>();
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('9');
  const [medium, setMedium] = useState<Medium>('English');
  const [hallId, setHallId] = useState<string | null>(null);
  const [weekday, setWeekday] = useState('Monday');
  const [startTime, setStartTime] = useState('10:30 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [monthlyFee, setMonthlyFee] = useState('2500');
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadClass = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const tuitionClass = await getClassById(params.classId);
      if (!tuitionClass) {
        setError('Class not found.');
        return;
      }
      setSubject(tuitionClass.subject);
      setGrade(String(tuitionClass.grade));
      setMedium(tuitionClass.medium);
      setHallId(tuitionClass.hallId);
      setWeekday(tuitionClass.day);
      setStartTime(tuitionClass.startTime);
      setEndTime(tuitionClass.endTime);
      setMonthlyFee(String(tuitionClass.monthlyFee));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load class.');
    } finally {
      setIsLoading(false);
    }
  }, [params.classId]);

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  useEffect(() => {
    if (!hallId || !params.classId) {
      setConflicts([]);
      return;
    }

    let active = true;
    findHallScheduleConflicts({
      hallId,
      weekday,
      startTime,
      endTime,
      excludeClassId: params.classId,
    })
      .then((nextConflicts) => {
        if (active) setConflicts(nextConflicts);
      })
      .catch(() => {
        if (active) setConflicts([]);
      });

    return () => {
      active = false;
    };
  }, [endTime, hallId, params.classId, startTime, weekday]);

  async function handleSave() {
    if (!params.classId) return;
    setError(null);
    if (!hallId) {
      setError('Select a hall for this class.');
      return;
    }
    setSubmitting(true);
    try {
      await updateClass(params.classId, {
        subject,
        grade: Number(grade),
        medium,
        hallId,
        weekday,
        startTime,
        endTime,
        monthlyFee: Number(monthlyFee) || 0,
      });
      router.replace(`/classes/${params.classId}` as Href);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save class.');
    } finally {
      setSubmitting(false);
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

  if (error && !subject) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to classes</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href={`/classes/${params.classId}` as Href} asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Edit Class</Text>
            <Text style={styles.subtitle}>Update subject, schedule, hall and monthly fee.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Class template</Text>
          <Text style={styles.heroTitle}>Update weekly schedule</Text>
          <Text style={styles.heroNote}>Fee changes apply to new invoices. Existing monthly records stay as recorded.</Text>
        </LinearGradient>

        <ScheduleConflictBanner conflicts={conflicts} />

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Class details</Text>
          <FormTextField label="Subject" placeholder="Mathematics" icon="book-open-page-variant" value={subject} onChangeText={setSubject} />
          <ChoiceChipGroup label="Grade" selected={grade} options={['6', '7', '8', '9', '10', '11']} onSelect={setGrade} />
          <ChoiceChipGroup label="Medium" selected={medium} options={['English', 'Sinhala', 'Tamil']} onSelect={(value) => setMedium(value as Medium)} />
          <HallPicker selectedHallId={hallId} onSelect={(nextHallId) => setHallId(nextHallId)} />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Schedule & fee</Text>
          <ChoiceChipGroup
            label="Day"
            selected={weekday}
            options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
            onSelect={setWeekday}
          />
          <FormTextField label="Start time" placeholder="10:30 AM" icon="clock-outline" value={startTime} onChangeText={setStartTime} />
          <FormTextField label="End time" placeholder="12:00 PM" icon="clock-outline" value={endTime} onChangeText={setEndTime} />
          <FormTextField label="Monthly fee (LKR)" placeholder="2500" icon="cash" keyboardType="number-pad" value={monthlyFee} onChangeText={setMonthlyFee} />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <Text style={styles.saveValue}>Updates save to your workspace</Text>
        <Pressable style={[styles.saveButton, submitting && styles.saveButtonDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveValue: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saveButton: { height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, minWidth: 140 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
