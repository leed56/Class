import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { attendanceStudentsSeed } from '@/features/attendance/data/sessionSeed';
import { mockFeeInvoices } from '@/features/fees/data/mockFees';
import { mockStudents } from '@/features/students/data/mockStudents';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const present = attendanceStudentsSeed.filter((item) => item.attendanceStatus === 'present').length;
const marked = attendanceStudentsSeed.filter((item) => item.attendanceStatus !== 'unmarked').length;
const attendanceRate = Math.round((present / Math.max(marked, 1)) * 100);
const collected = mockFeeInvoices.reduce((sum, item) => sum + item.paidAmount, 0);
const outstanding = mockFeeInvoices.reduce((sum, item) => sum + item.outstandingAmount, 0);
const collectionRate = Math.round((collected / Math.max(collected + outstanding, 1)) * 100);
const defaulters = mockFeeInvoices.filter((item) => item.outstandingAmount > 0).length;
const averageStudentAttendance = Math.round(mockStudents.reduce((sum, item) => sum + item.attendancePercent, 0) / mockStudents.length);

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/more" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>Export-ready insights for attendance, fees and class performance.</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="download-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="chart-box-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>June 2026 performance</Text>
            <Text style={styles.heroTitle}>Teacher command report</Text>
            <Text style={styles.heroNote}>{collectionRate}% fees collected • {attendanceRate}% session attendance</Text>
          </View>
        </LinearGradient>

        <View style={styles.monthRow}>
          <View style={styles.monthChipActive}><Text style={styles.monthChipActiveText}>June</Text></View>
          <View style={styles.monthChip}><Text style={styles.monthChipText}>May</Text></View>
          <View style={styles.monthChip}><Text style={styles.monthChipText}>April</Text></View>
          <View style={styles.monthChip}><Text style={styles.monthChipText}>Custom</Text></View>
        </View>

        <View style={styles.summaryRow}>
          <InsightCard label="Collection" value={`${collectionRate}%`} note={formatLkr(outstanding) + ' due'} icon="cash-multiple" color={colors.success} />
          <InsightCard label="Attendance" value={`${averageStudentAttendance}%`} note="Average student rate" icon="clipboard-check-outline" color={colors.primary} />
        </View>

        <PremiumCard style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="account-alert-outline" size={24} color={colors.danger} />
          </View>
          <View style={styles.alertCopy}>
            <Text style={styles.cardTitle}>Defaulter follow-up report</Text>
            <Text style={styles.cardSubtitle}>{defaulters} parents need payment follow-up this month. Export list or send WhatsApp reminders.</Text>
          </View>
          <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>{defaulters}</Text></View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Report library</Text>
          <Text style={styles.sectionAction}>Export all</Text>
        </View>

        <View style={styles.reportGrid}>
          <ReportTile title="VAT Quarter" subtitle="Output, input and net VAT from SQLite" icon="receipt-text-check-outline" color={colors.info} href="/reports/vat" />
          <ReportTile title="Attendance Report" subtitle="Present, late and absent by class" icon="clipboard-list-outline" color={colors.primary} />
          <ReportTile title="Fee Collection" subtitle="Paid, partial and outstanding fees" icon="cash-clock" color={colors.success} />
          <ReportTile title="Defaulter List" subtitle="Parents to follow up this week" icon="account-cancel-outline" color={colors.danger} />
          <ReportTile title="Class Performance" subtitle="Attendance trend and risk students" icon="chart-line" color={colors.warning} />
        </View>

        <PremiumCard style={styles.performanceCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Class performance snapshot</Text>
              <Text style={styles.cardSubtitle}>Highest priority classes for teacher attention</Text>
            </View>
            <MaterialCommunityIcons name="trending-up" size={24} color={colors.success} />
          </View>
          <PerformanceRow subject="Mathematics G9" attendance="91%" collection="78%" />
          <View style={styles.divider} />
          <PerformanceRow subject="Science G8" attendance="84%" collection="62%" />
          <View style={styles.divider} />
          <PerformanceRow subject="English G7" attendance="88%" collection="70%" />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function InsightCard({ label, value, note, icon, color }: { label: string; value: string; note: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: `${color}1F` }]}> 
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={[styles.insightValue, { color }]}>{value}</Text>
      <Text style={styles.insightNote}>{note}</Text>
    </PremiumCard>
  );
}

function ReportTile({ title, subtitle, icon, color, href }: { title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; href?: string }) {
  const content = (
    <PremiumCard style={styles.reportTile}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}1F` }]}> 
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
      <View style={styles.exportPill}>
        <MaterialCommunityIcons name={href ? 'chevron-right' : 'file-export-outline'} size={13} color={colors.primary} />
        <Text style={styles.exportPillText}>{href ? 'Open' : 'Export'}</Text>
      </View>
    </PremiumCard>
  );

  if (!href) return content;

  return (
    <Link href={href as never} asChild>
      <Pressable>{content}</Pressable>
    </Link>
  );
}

function PerformanceRow({ subject, attendance, collection }: { subject: string; attendance: string; collection: string }) {
  return (
    <View style={styles.performanceRow}>
      <View style={styles.performanceSubjectBlock}>
        <Text style={styles.performanceSubject}>{subject}</Text>
        <Text style={styles.performanceMeta}>Attendance {attendance} • Collection {collection}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
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
  monthRow: { flexDirection: 'row', gap: spacing.sm },
  monthChip: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  monthChipActive: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.primary },
  monthChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  monthChipActiveText: { color: 'white', fontSize: 12, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  insightCard: { flex: 1, padding: spacing.lg, gap: spacing.xs },
  insightIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  insightLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  insightValue: { fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  insightNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.dangerSoft },
  alertIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft },
  alertCopy: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  alertBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  alertBadgeText: { color: 'white', fontSize: 13, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  reportTile: { width: '48%', minHeight: 170, justifyContent: 'space-between', padding: spacing.lg },
  tileIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { marginTop: spacing.md, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  tileSubtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  exportPill: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.primarySoft },
  exportPillText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  performanceCard: { gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm },
  performanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  performanceSubjectBlock: { flex: 1 },
  performanceSubject: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  performanceMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
});
