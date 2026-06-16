import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { createClass } from '@/features/classes/classService';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const mediumOptions: Medium[] = ['English', 'Sinhala', 'Tamil'];
const weekdayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatFee(value: string) {
  const fee = Number(value || 0);
  return `LKR ${Math.max(0, fee).toLocaleString('en-LK')}`;
}

export default function NewClassScreen() {
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('9');
  const [medium, setMedium] = useState<Medium>('English');
  const [hall, setHall] = useState('');
  const [weekday, setWeekday] = useState('Saturday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [monthlyFee, setMonthlyFee] = useState('3000');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readinessLabel = useMemo(() => {
    if (!subject.trim()) return 'Subject required';
    if (!startTime.trim() || !endTime.trim()) return 'Time required';
    return 'Ready to publish';
  }, [endTime, startTime, subject]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      await createClass({
        subject,
        grade: Number(grade),
        medium,
        hall,
        weekday,
        startTime,
        endTime,
        monthlyFee: Number(monthlyFee || 0),
      });
      router.replace('/(tabs)/classes');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save class.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Add Class</Text>
            <Text style={styles.subtitle}>Set up a premium teaching schedule for attendance, fees and parent updates.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="google-classroom" size={28} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Premium class setup</Text>
            <Text style={styles.heroTitle}>Build your teaching schedule once.</Text>
            <Text style={styles.heroNote}>Enrollment, attendance, monthly invoices and receipts will connect to this class.</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Class identity</Text>
          <FormTextField label="Subject" placeholder="Mathematics" icon="book-open-page-variant" value={subject} onChangeText={setSubject} />
          <ChoiceChipGroup label="Grade" selected={grade} options={gradeOptions} onSelect={setGrade} />
          <ChoiceChipGroup label="Medium" selected={medium} options={mediumOptions} onSelect={(value) => setMedium(value as Medium)} />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <ChoiceChipGroup label="Class day" selected={weekday} options={weekdayOptions} onSelect={setWeekday} />
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <FormTextField label="Start time" placeholder="08:00" icon="clock-start" keyboardType="numbers-and-punctuation" value={startTime} onChangeText={setStartTime} />
            </View>
            <View style={styles.timeField}>
              <FormTextField label="End time" placeholder="10:00" icon="clock-end" keyboardType="numbers-and-punctuation" value={endTime} onChangeText={setEndTime} />
            </View>
          </View>
          <FormTextField label="Hall / Location" placeholder="Hall A" icon="map-marker-outline" value={hall} onChangeText={setHall} />
        </PremiumCard>

        <PremiumCard style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <View style={styles.feeIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={23} color={colors.success} />
            </View>
            <View style={styles.feeCopy}>
              <Text style={styles.cardTitle}>Monthly tuition fee</Text>
              <Text style={styles.feeText}>Cash-first tracking. Payments and receipts will use this amount later.</Text>
            </View>
          </View>
          <FormTextField label="Monthly fee" placeholder="3000" icon="currency-usd" keyboardType="number-pad" value={monthlyFee} onChangeText={setMonthlyFee} />
          <View style={styles.feePreviewPill}>
            <Text style={styles.feePreviewLabel}>Preview</Text>
            <Text style={styles.feePreviewValue}>{formatFee(monthlyFee)}</Text>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.nextCard}>
          <View style={styles.nextRow}>
            <MaterialCommunityIcons name="account-multiple-plus-outline" size={24} color={colors.primary} />
            <View style={styles.nextCopy}>
              <Text style={styles.nextTitle}>Next after saving</Text>
              <Text style={styles.nextText}>You’ll enroll students into this class before taking attendance or generating monthly invoices.</Text>
            </View>
          </View>
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Class quality</Text>
          <Text style={styles.saveValue}>{readinessLabel}</Text>
        </View>
        <Pressable style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="calendar-check" size={18} color="white" />}
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Class'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { minHeight: 144, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
  feeCard: { gap: spacing.lg, borderColor: colors.successSoft },
  feeHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  feeIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  feeCopy: { flex: 1 },
  feeText: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  feePreviewPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: 14, backgroundColor: colors.successSoft },
  feePreviewLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  feePreviewValue: { color: colors.success, fontSize: 17, fontWeight: '900' },
  nextCard: { borderColor: colors.primarySoft },
  nextRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  nextCopy: { flex: 1 },
  nextTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  nextText: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  disabledButton: { opacity: 0.72 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
