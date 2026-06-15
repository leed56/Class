import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/MetricCard';
import { PremiumCard } from '@/components/PremiumCard';
import { StudentCard } from '@/features/students/components/StudentCard';
import { StudentFilterBar } from '@/features/students/components/StudentFilterBar';
import { mockStudents } from '@/features/students/data/mockStudents';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const totalOutstanding = mockStudents.reduce((sum, student) => sum + student.outstandingAmount, 0);
const pendingCount = mockStudents.filter((student) => student.outstandingAmount > 0).length;
const consentMissingCount = mockStudents.filter((student) => !student.consentCaptured).length;
const averageAttendance = Math.round(
  mockStudents.reduce((sum, student) => sum + student.attendancePercent, 0) / mockStudents.length,
);

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function StudentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Students</Text>
            <Text style={styles.subtitle}>Manage students, parents, fees, consent and attendance.</Text>
          </View>
          <View style={styles.addButton}>
            <MaterialCommunityIcons name="account-plus" size={22} color="white" />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="account-school" size={28} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Active student registry</Text>
            <Text style={styles.heroValue}>{mockStudents.length} students</Text>
            <Text style={styles.heroNote}>{pendingCount} need fee follow-up • {consentMissingCount} consent pending</Text>
          </View>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <MetricCard label="Avg Attendance" value={`${averageAttendance}%`} icon="chart-line" tone={colors.success} />
          <MetricCard label="Outstanding" value={formatLkr(totalOutstanding)} icon="cash-alert" tone={colors.danger} />
        </View>

        <PremiumCard style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <MaterialCommunityIcons name="whatsapp" size={22} color={colors.success} />
          </View>
          <View style={styles.insightTextBlock}>
            <Text style={styles.insightTitle}>High-value action</Text>
            <Text style={styles.insightCopy}>Send WhatsApp reminders to parents with overdue June fees.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </PremiumCard>

        <StudentFilterBar />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent students</Text>
          <Text style={styles.sectionAction}>View all</Text>
        </View>

        <View style={styles.list}>
          {mockStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </View>
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
    maxWidth: 270,
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
  heroCopy: {
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
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.9,
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
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.successSoft,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextBlock: {
    flex: 1,
  },
  insightTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  insightCopy: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
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
  list: {
    gap: spacing.md,
  },
});
