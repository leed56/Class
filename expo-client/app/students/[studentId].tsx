import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { FeeStatusBadge } from '@/features/students/components/FeeStatusBadge';
import { getStudentById } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function StudentProfileScreen() {
  const params = useLocalSearchParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudent() {
      if (!params.studentId) return;
      setIsLoading(true);
      setError(null);

      try {
        const nextStudent = await getStudentById(params.studentId);
        setStudent(nextStudent);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load student.');
      } finally {
        setIsLoading(false);
      }
    }

    loadStudent();
  }, [params.studentId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateTitle}>Loading student...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !student) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={28} color={colors.danger} />
          <Text style={styles.errorText}>{error ?? 'Student not found.'}</Text>
          <Link href="/(tabs)/students" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Back to Students</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/students" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Student Profile</Text>
            <Text style={styles.subtitle}>Attendance, fees, parent communication and consent in one place.</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textPrimary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroName}>{student.name}</Text>
            <Text style={styles.heroMeta}>Grade {student.grade} • {student.medium} • {student.school}</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="school-outline" size={14} color="white" />
                <Text style={styles.heroBadgeText}>{student.className}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.actionRow}>
          <ProfileAction icon="clipboard-check-outline" label="Attendance" color={colors.primary} />
          <ProfileAction icon="cash-plus" label="Payment" color={colors.success} />
          <ProfileAction icon="whatsapp" label="Message" color={colors.warning} />
        </View>

        <View style={styles.metricsRow}>
          <PremiumCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Attendance</Text>
            <Text style={[styles.metricValue, { color: student.attendancePercent >= 80 ? colors.success : colors.warning }]}>{student.attendancePercent}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${student.attendancePercent}%` }]} />
            </View>
          </PremiumCard>
          <PremiumCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={[styles.metricValue, { color: student.outstandingAmount > 0 ? colors.danger : colors.success }]}>{formatLkr(student.outstandingAmount)}</Text>
            <Text style={styles.metricNote}>Fee invoices pending</Text>
          </PremiumCard>
        </View>

        <PremiumCard style={styles.parentCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Parent communication</Text>
              <Text style={styles.cardSubtitle}>Main guardian contact for receipts and reminders</Text>
            </View>
            <MaterialCommunityIcons name="phone-message-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.parentRow}>
            <View style={styles.parentIcon}>
              <MaterialCommunityIcons name="account-heart-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.parentCopy}>
              <Text style={styles.parentName}>{student.parentName}</Text>
              <Text style={styles.parentPhone}>{student.parentPhone}</Text>
            </View>
            <View style={styles.whatsappPill}>
              <MaterialCommunityIcons name="whatsapp" size={15} color={colors.success} />
              <Text style={styles.whatsappText}>Ready</Text>
            </View>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.invoiceCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Current fee status</Text>
              <Text style={styles.cardSubtitle}>Cash-first tuition payment tracking</Text>
            </View>
            <FeeStatusBadge status={student.feeStatus} />
          </View>
          <View style={styles.invoiceRow}>
            <FeeFigure label="Monthly fee" value={formatLkr(student.monthlyFee)} />
            <FeeFigure label="Paid" value={formatLkr(0)} />
            <FeeFigure label="Pending" value={formatLkr(student.outstandingAmount)} danger={student.outstandingAmount > 0} />
          </View>
        </PremiumCard>

        <PremiumCard style={styles.consentCard}>
          <View style={styles.parentRow}>
            <View style={[styles.parentIcon, { backgroundColor: student.consentCaptured ? colors.successSoft : colors.warningSoft }]}>
              <MaterialCommunityIcons name={student.consentCaptured ? 'shield-check-outline' : 'shield-alert-outline'} size={21} color={student.consentCaptured ? colors.success : colors.warning} />
            </View>
            <View style={styles.parentCopy}>
              <Text style={styles.parentName}>{student.consentCaptured ? 'Consent captured' : 'Consent pending'}</Text>
              <Text style={styles.parentPhone}>Parent data and communication permission status</Text>
            </View>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.activityCard}>
          <Text style={styles.cardTitle}>Recent activity</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.warning} />
            </View>
            <View style={styles.parentCopy}>
              <Text style={styles.activityTitle}>No payments recorded yet</Text>
              <Text style={styles.parentPhone}>Payment activity will appear when fee tracking is connected.</Text>
            </View>
          </View>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileAction({ icon, label, color }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color: string }) {
  return (
    <View style={styles.profileAction}>
      <View style={[styles.profileActionIcon, { backgroundColor: `${color}1F` }]}> 
        <MaterialCommunityIcons name={icon} size={21} color={color} />
      </View>
      <Text style={styles.profileActionText}>{label}</Text>
    </View>
  );
}

function FeeFigure({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.feeFigure}>
      <Text style={styles.feeLabel}>{label}</Text>
      <Text style={[styles.feeValue, { color: danger ? colors.danger : colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  stateTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  errorText: { textAlign: 'center', color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  primaryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  primaryButtonText: { color: 'white', fontSize: 13, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  avatarLarge: { width: 70, height: 70, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  avatarLargeText: { color: 'white', fontSize: 22, fontWeight: '900' },
  heroCopy: { flex: 1 },
  heroName: { color: 'white', fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  heroMeta: { marginTop: 5, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  heroBadgeRow: { marginTop: spacing.md, flexDirection: 'row' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 11, paddingVertical: 7 },
  heroBadgeText: { color: 'white', fontSize: 11, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  profileAction: { flex: 1, minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  profileActionIcon: { width: 39, height: 39, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  profileActionText: { color: colors.textPrimary, fontSize: 11, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', gap: spacing.md },
  metricCard: { flex: 1, padding: spacing.lg },
  metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  metricValue: { marginTop: 5, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  metricNote: { marginTop: 7, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  progressTrack: { marginTop: spacing.md, height: 9, borderRadius: 999, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.success },
  parentCard: { gap: spacing.lg },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  parentIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  parentCopy: { flex: 1 },
  parentName: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  parentPhone: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  whatsappPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: colors.successSoft, paddingHorizontal: 9, paddingVertical: 6 },
  whatsappText: { color: colors.success, fontSize: 10, fontWeight: '900' },
  invoiceCard: { gap: spacing.lg },
  invoiceRow: { flexDirection: 'row', gap: spacing.sm },
  feeFigure: { flex: 1, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  feeLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  feeValue: { marginTop: 4, fontSize: 13, fontWeight: '900' },
  consentCard: { borderColor: colors.primarySoft },
  activityCard: { gap: spacing.md },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  activityIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  activityTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
});