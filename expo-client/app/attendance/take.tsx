import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { AttendanceStudentRow } from '@/features/attendance/components/AttendanceStudentRow';
import { attendanceSessionSeed, attendanceStudentsSeed } from '@/features/attendance/data/sessionSeed';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const presentCount = attendanceStudentsSeed.filter((item) => item.attendanceStatus === 'present').length;
const lateCount = attendanceStudentsSeed.filter((item) => item.attendanceStatus === 'late').length;
const absentCount = attendanceStudentsSeed.filter((item) => item.attendanceStatus === 'absent').length;
const markedCount = attendanceStudentsSeed.filter((item) => item.attendanceStatus !== 'unmarked').length;
const completionPercent = Math.round((markedCount / attendanceStudentsSeed.length) * 100);

export default function TakeAttendanceScreen() {
  const session = attendanceSessionSeed;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Take Attendance</Text>
            <Text style={styles.subtitle}>Mark students quickly for today’s session.</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={21} color={colors.primary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{session.date}</Text>
            <Text style={styles.heroTitle}>{session.subject} Grade {session.grade}</Text>
            <Text style={styles.heroNote}>{session.startTime} - {session.endTime} • {session.hall} • {session.medium}</Text>
          </View>
        </LinearGradient>

        <View style={styles.summaryRow}>
          <SummaryBox label="Present" value={`${presentCount}`} color={colors.success} />
          <SummaryBox label="Late" value={`${lateCount}`} color={colors.warning} />
          <SummaryBox label="Absent" value={`${absentCount}`} color={colors.danger} />
        </View>

        <PremiumCard style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <View>
              <Text style={styles.cardTitle}>Marking progress</Text>
              <Text style={styles.cardSubtitle}>{markedCount} of {attendanceStudentsSeed.length} students marked</Text>
            </View>
            <Text style={styles.progressPercent}>{completionPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
          </View>
        </PremiumCard>

        <View style={styles.quickRow}>
          <View style={styles.quickChipActive}><Text style={styles.quickChipActiveText}>All</Text></View>
          <View style={styles.quickChip}><Text style={styles.quickChipText}>Unmarked</Text></View>
          <View style={styles.quickChip}><Text style={styles.quickChipText}>Fees pending</Text></View>
        </View>

        <PremiumCard style={styles.offlineCard}>
          <View style={styles.offlineIcon}>
            <MaterialCommunityIcons name="cloud-sync-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.offlineCopy}>
            <Text style={styles.cardTitle}>Offline-ready session</Text>
            <Text style={styles.cardSubtitle}>Marks can be saved locally first and synced when internet is available.</Text>
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Student list</Text>
          <Text style={styles.sectionAction}>Bulk present</Text>
        </View>

        <PremiumCard style={styles.listCard}>
          {attendanceStudentsSeed.map((student, index) => (
            <View key={student.id}>
              <AttendanceStudentRow student={student} />
              {index < attendanceStudentsSeed.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Session status</Text>
          <Text style={styles.saveValue}>{markedCount}/{attendanceStudentsSeed.length} marked</Text>
        </View>
        <View style={styles.saveButton}>
          <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
          <Text style={styles.saveButtonText}>Save</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <PremiumCard style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryBox: { flex: 1, padding: spacing.lg },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  summaryValue: { marginTop: 5, fontSize: 24, fontWeight: '900' },
  progressCard: { gap: spacing.md },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  progressPercent: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.primarySoft },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.success },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickChip: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  quickChipActive: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.primary },
  quickChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  quickChipActiveText: { color: 'white', fontSize: 12, fontWeight: '900' },
  offlineCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  offlineIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  offlineCopy: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  listCard: { paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
