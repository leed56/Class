import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function NewStudentScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/students" asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Add Student</Text>
            <Text style={styles.subtitle}>Create a complete profile for attendance, fees and parent communication.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="account-plus" size={28} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Premium student profile</Text>
            <Text style={styles.heroTitle}>Register once. Use everywhere.</Text>
            <Text style={styles.heroNote}>Attendance, fees, receipts and reminders will use this record.</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Student details</Text>
          <FormTextField label="Student name" placeholder="Kavindu Perera" icon="account-outline" />
          <FormTextField label="School" placeholder="Ananda College" icon="school-outline" />
          <ChoiceChipGroup label="Grade" selected="9" options={['6', '7', '8', '9', '10', '11']} />
          <ChoiceChipGroup label="Medium" selected="English" options={['English', 'Sinhala', 'Tamil']} />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Parent contact</Text>
          <FormTextField label="Parent name" placeholder="Mrs. Perera" icon="account-heart-outline" />
          <FormTextField label="Parent phone" placeholder="+94 77 123 4567" icon="phone-outline" keyboardType="phone-pad" />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Enrollment & fee</Text>
          <ChoiceChipGroup label="Class" selected="Math G9" options={['Math G9', 'Science G8', 'English G7']} />
          <FormTextField label="Monthly fee" placeholder="2500" icon="cash" keyboardType="number-pad" />
        </PremiumCard>

        <PremiumCard style={styles.consentCard}>
          <View style={styles.consentRow}>
            <View style={styles.consentIcon}>
              <MaterialCommunityIcons name="shield-check-outline" size={23} color={colors.primary} />
            </View>
            <View style={styles.consentCopy}>
              <Text style={styles.consentTitle}>Parent consent</Text>
              <Text style={styles.consentText}>Capture permission to store student details and send parent communication.</Text>
            </View>
          </View>
          <View style={styles.consentPill}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.consentPillText}>Consent captured</Text>
          </View>
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Profile quality</Text>
          <Text style={styles.saveValue}>Ready to save</Text>
        </View>
        <View style={styles.saveButton}>
          <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
          <Text style={styles.saveButtonText}>Save Student</Text>
        </View>
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
  hero: { minHeight: 140, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  consentCard: { gap: spacing.lg, borderColor: colors.primarySoft },
  consentRow: { flexDirection: 'row', gap: spacing.md },
  consentIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  consentCopy: { flex: 1 },
  consentTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  consentText: { marginTop: 5, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  consentPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.successSoft },
  consentPillText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
