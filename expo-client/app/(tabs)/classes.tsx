import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/MetricCard';
import { ClassCard } from '@/features/classes/components/ClassCard';
import { mockClasses } from '@/features/classes/data/mockClasses';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const todayClasses = mockClasses.filter((item) => item.day === 'Monday').length;
const totalStudents = mockClasses.reduce((sum, item) => sum + item.enrolledCount, 0);
const averageAttendance = Math.round(
  mockClasses.reduce((sum, item) => sum + item.attendanceAverage, 0) / mockClasses.length,
);

export default function ClassesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Classes</Text>
            <Text style={styles.subtitle}>Create schedules, manage halls, fees, capacity and attendance.</Text>
          </View>
          <View style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="calendar-star" size={29} color="white" />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Today’s teaching plan</Text>
            <Text style={styles.heroValue}>{todayClasses} classes today</Text>
            <Text style={styles.heroNote}>Next: Mathematics Grade 9 • 10:30 AM • Hall A</Text>
          </View>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <MetricCard label="Active Students" value={`${totalStudents}`} icon="account-group" tone={colors.primary} />
          <MetricCard label="Avg Attendance" value={`${averageAttendance}%`} icon="chart-line" tone={colors.success} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Class schedule</Text>
          <Text style={styles.sectionAction}>This week</Text>
        </View>

        <View style={styles.dayTabs}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
            <View key={day} style={[styles.dayChip, index === 0 && styles.activeDayChip]}>
              <Text style={[styles.dayChipText, index === 0 && styles.activeDayChipText]}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.list}>
          {mockClasses.map((item) => (
            <ClassCard key={item.id} item={item} />
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
});
