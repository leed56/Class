import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { createClass } from '@/features/classes/classService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function NewClassScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('9');
  const [medium, setMedium] = useState<Medium>('English');
  const [hall, setHall] = useState('');
  const [weekday, setWeekday] = useState('Monday');
  const [startTime, setStartTime] = useState('10:30 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [monthlyFee, setMonthlyFee] = useState('2500');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      await createClass({
        subject,
        grade: Number(grade),
        medium,
        hall,
        weekday,
        startTime,
        endTime,
        monthlyFee: Number(monthlyFee) || 0,
      });
      router.replace('/(tabs)/classes');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save class.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Create Class</Text>
            <Text style={styles.subtitle}>Set subject, schedule, hall and monthly fee for a recurring class.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Class template</Text>
          <Text style={styles.heroTitle}>One class, weekly schedule</Text>
          <Text style={styles.heroNote}>Students enroll into this class for attendance and monthly fees.</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Class details</Text>
          <FormTextField label="Subject" placeholder="Mathematics" icon="book-open-page-variant" value={subject} onChangeText={setSubject} />
          <ChoiceChipGroup label="Grade" selected={grade} options={['6', '7', '8', '9', '10', '11']} onSelect={setGrade} />
          <ChoiceChipGroup label="Medium" selected={medium} options={['English', 'Sinhala', 'Tamil']} onSelect={(value) => setMedium(value as Medium)} />
          <FormTextField label="Hall / location" placeholder="Hall A" icon="map-marker-outline" value={hall} onChangeText={setHall} />
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
        <Text style={styles.saveValue}>Saved to your workspace on submit</Text>
        <Pressable style={[styles.saveButton, submitting && styles.saveButtonDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Class</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
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
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveValue: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saveButton: { height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, minWidth: 120 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
