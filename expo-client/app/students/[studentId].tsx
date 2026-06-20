import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useLocalSearchParams, useRouter, Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { useWorkspaceRole } from '@/features/auth/useWorkspaceRole';
import { EnrolledClassCard } from '@/features/enrollment/components/EnrolledClassCard';
import { listStudentEnrollments, StudentEnrollmentEntry } from '@/features/enrollment/enrollmentService';
import { listStudentOpenInvoices } from '@/features/fees/feeService';
import { FeeInvoice } from '@/features/fees/models';
import { FeeStatusBadge } from '@/features/students/components/FeeStatusBadge';
import { getStudentById, archiveStudent } from '@/features/students/studentService';
import { formatStudentMeta } from '@/features/students/studentProfileModel';
import { Student } from '@/features/students/types';
import { InstituteType } from '@/lib/database.types';
import { sendLoggedFeeReminder } from '@/features/fees/feeReminderService';
import { LanguageCode } from '@/lib/database.types';
import { buildParentMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function invoiceLedgerLabel(invoice: FeeInvoice) {
  if (invoice.invoiceType === 'admission') return 'Admission fee';
  if (invoice.invoiceType === 'material') return 'Material fee';
  if (invoice.invoiceType === 'exam') return 'Exam fee';
  return `${invoice.className} • ${invoice.month}`;
}

export default function StudentProfileScreen() {
  const router = useRouter();
  const { hasPermission } = useWorkspaceRole();
  const params = useLocalSearchParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollmentEntry[]>([]);
  const [openInvoices, setOpenInvoices] = useState<FeeInvoice[]>([]);
  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [workspaceLanguage, setWorkspaceLanguage] = useState<LanguageCode>('en');
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [academySector, setAcademySector] = useState<string | null>('school_tuition');
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    if (!params.studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextStudent, nextEnrollments, workspace, invoices] = await Promise.all([
        getStudentById(params.studentId),
        listStudentEnrollments(params.studentId),
        getCurrentWorkspace(),
        listStudentOpenInvoices(params.studentId),
      ]);
      setStudent(nextStudent);
      setEnrollments(nextEnrollments);
      setOpenInvoices(invoices);
      setWorkspaceName(workspace?.name ?? 'Your workspace');
      setWorkspaceLanguage(workspace?.default_language ?? 'en');
      setWorkspaceType(workspace?.institute_type ?? 'solo');
      setAcademySector(workspace?.academy_sector ?? 'school_tuition');
      if (!nextStudent) setError('Student not found.');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load student.');
    } finally {
      setIsLoading(false);
    }
  }, [params.studentId]);

  useFocusEffect(
    useCallback(() => {
      loadStudent();
    }, [loadStudent]),
  );

  async function messageParent() {
    if (!student) return;

    if (student.outstandingAmount > 0 && openInvoices[0]) {
      await sendLoggedFeeReminder({
        workspaceName,
        invoice: openInvoices[0],
        locale: workspaceLanguage,
      });
      return;
    }

    const message = buildParentMessage({
      workspaceName,
      studentName: student.name,
      parentName: student.parentName,
    });

    await openWhatsAppChat(student.parentPhone, message);
  }

  function confirmArchive() {
    if (!student) return;
    Alert.alert(
      'Archive student?',
      `${student.name} will be hidden from active lists. Attendance, fees and receipts stay saved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: handleArchive },
      ],
    );
  }

  async function handleArchive() {
    if (!student) return;
    setIsArchiving(true);
    setError(null);
    try {
      await archiveStudent(student.id);
      router.replace('/(tabs)/students');
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Could not archive student.');
    } finally {
      setIsArchiving(false);
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

  if (error || !student) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Student not found.'}</Text>
          <Link href="/(tabs)/students" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to students</Text>
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
          <Link href="/(tabs)/students" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Student Profile</Text>
            <Text style={styles.subtitle}>Attendance, fees, parent communication and consent in one place.</Text>
          </View>
          <Link href={`/students/edit/${student.id}` as Href} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="account-edit-outline" size={22} color={colors.primary} />
            </Pressable>
          </Link>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroName}>{student.name}</Text>
            <Text style={styles.heroMeta}>
              {formatStudentMeta(student.grade, student.medium, student.school, workspaceType, academySector)}
            </Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="school-outline" size={14} color="white" />
                <Text style={styles.heroBadgeText}>{student.className}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.actionRow}>
          <ProfileAction
            icon="clipboard-check-outline"
            label="Attendance"
            color={colors.primary}
            href={`/students/${student.id}/attendance` as Href}
          />
          <ProfileAction
            icon="qrcode"
            label="QR ID"
            color={colors.info}
            href={`/students/${student.id}/qr-card` as Href}
          />
          <ProfileAction
            icon="cash-plus"
            label="Payment"
            color={colors.success}
            href={openInvoices.length > 0 ? (`/fees/record-payment?studentId=${student.id}` as Href) : undefined}
          />
          <ProfileAction icon="whatsapp" label="Message" color={colors.warning} onPress={messageParent} />
        </View>

        <View style={styles.metricsRow}>
          <PremiumCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Attendance</Text>
            <Text style={[styles.metricValue, { color: student.attendancePercent >= 80 ? colors.success : colors.danger }]}>
              {student.attendancePercent}%
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${student.attendancePercent}%` }]} />
            </View>
          </PremiumCard>
          <PremiumCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={[styles.metricValue, { color: student.outstandingAmount > 0 ? colors.danger : colors.success }]}>
              {formatLkr(student.outstandingAmount)}
            </Text>
            <Text style={styles.metricNote}>{student.outstandingAmount > 0 ? 'Follow up on pending fees' : 'Fees up to date this month'}</Text>
          </PremiumCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Enrolled classes</Text>
          <Text style={styles.sectionCount}>{enrollments.length}</Text>
        </View>

        {enrollments.length === 0 ? (
          <PremiumCard>
            <Text style={styles.emptyClassesTitle}>Not enrolled yet</Text>
            <Text style={styles.emptyClassesCopy}>Open a class and use Enroll Student to add this student to a roster.</Text>
          </PremiumCard>
        ) : (
          <View style={styles.classList}>
            {enrollments.map((entry) => (
              <EnrolledClassCard key={entry.enrollmentId} tuitionClass={entry.tuitionClass} />
            ))}
          </View>
        )}

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
            <Pressable style={styles.whatsappPill} onPress={messageParent}>
              <MaterialCommunityIcons name="whatsapp" size={15} color={colors.success} />
              <Text style={styles.whatsappText}>Message</Text>
            </Pressable>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.invoiceCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Fee ledger</Text>
              <Text style={styles.cardSubtitle}>Open invoices including admission, material and exam charges</Text>
            </View>
            <FeeStatusBadge status={student.feeStatus} />
          </View>

          {openInvoices.length === 0 ? (
            <Text style={styles.ledgerEmpty}>No outstanding invoices — fees are up to date.</Text>
          ) : (
            <View style={styles.ledgerList}>
              {openInvoices.map((invoice) => (
                <View key={invoice.id} style={styles.ledgerRow}>
                  <View style={styles.ledgerCopy}>
                    <Text style={styles.ledgerTitle}>{invoiceLedgerLabel(invoice)}</Text>
                    <Text style={styles.ledgerMeta}>
                      Paid {formatLkr(invoice.paidAmount)} of {formatLkr(invoice.monthlyFee)}
                    </Text>
                  </View>
                  <Text style={styles.ledgerDue}>{formatLkr(invoice.outstandingAmount)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.ledgerActions}>
            <NavPressable href={`/fees/charge?studentId=${student.id}` as Href} style={styles.ledgerActionSecondary}>
              <MaterialCommunityIcons name="file-document-plus-outline" size={18} color={colors.warning} />
              <Text style={styles.ledgerActionSecondaryText}>Issue charge</Text>
            </NavPressable>
            {openInvoices.length > 0 ? (
              <NavPressable href={`/fees/record-payment?studentId=${student.id}` as Href} style={styles.ledgerAction}>
                <MaterialCommunityIcons name="cash-multiple" size={18} color={colors.primary} />
                <Text style={styles.ledgerActionText}>Record payment</Text>
              </NavPressable>
            ) : null}
          </View>
        </PremiumCard>

        {workspaceType !== 'solo' ? (
          <PremiumCard style={styles.certificateCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Certifications</Text>
                <Text style={styles.cardSubtitle}>Issue completion and achievement certificates</Text>
              </View>
              <MaterialCommunityIcons name="certificate-outline" size={24} color={colors.primary} />
            </View>
            <NavPressable href={`/students/${student.id}/certificates` as Href} style={styles.certificateAction}>
              <MaterialCommunityIcons name="certificate" size={18} color={colors.primary} />
              <Text style={styles.certificateActionText}>Open certifications</Text>
            </NavPressable>
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.consentCard}>
          <View style={styles.parentRow}>
            <View style={[styles.parentIcon, { backgroundColor: student.consentCaptured ? colors.successSoft : colors.warningSoft }]}>
              <MaterialCommunityIcons
                name={student.consentCaptured ? 'shield-check-outline' : 'shield-alert-outline'}
                size={21}
                color={student.consentCaptured ? colors.success : colors.warning}
              />
            </View>
            <View style={styles.parentCopy}>
              <Text style={styles.parentName}>{student.consentCaptured ? 'Consent captured' : 'Consent pending'}</Text>
              <Text style={styles.parentPhone}>Parent data and communication permission status</Text>
            </View>
          </View>
        </PremiumCard>

        {hasPermission('archive_records') ? (
        <PremiumCard style={styles.archiveCard}>
          <View style={styles.archiveCopy}>
            <Text style={styles.archiveTitle}>Archive student</Text>
            <Text style={styles.archiveText}>Hide graduated or inactive students without deleting attendance and payment history.</Text>
          </View>
          <Pressable style={[styles.archiveButton, isArchiving && styles.archiveButtonDisabled]} onPress={confirmArchive} disabled={isArchiving}>
            {isArchiving ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="archive-outline" size={18} color={colors.danger} />
                <Text style={styles.archiveButtonText}>Archive</Text>
              </>
            )}
          </Pressable>
        </PremiumCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileAction({
  icon,
  label,
  color,
  onPress,
  href,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  href?: Href;
}) {
  const content = (
    <>
      <View style={[styles.profileActionIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={21} color={color} />
      </View>
      <Text style={styles.profileActionText}>{label}</Text>
    </>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable style={styles.profileAction}>{content}</Pressable>
      </Link>
    );
  }

  return (
    <Pressable style={styles.profileAction} onPress={onPress} disabled={!onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
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
  ledgerEmpty: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  ledgerList: { gap: spacing.sm },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  ledgerCopy: { flex: 1, minWidth: 0 },
  ledgerTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  ledgerMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  ledgerDue: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  ledgerAction: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primarySoft, backgroundColor: colors.primarySoft },
  ledgerActionText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  ledgerActions: { flexDirection: 'row', gap: spacing.sm },
  ledgerActionSecondary: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.warningSoft, backgroundColor: colors.warningSoft },
  ledgerActionSecondaryText: { color: colors.warning, fontSize: 13, fontWeight: '900' },
  certificateCard: { gap: spacing.lg },
  certificateAction: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primarySoft, backgroundColor: colors.primarySoft },
  certificateActionText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  consentCard: { borderColor: colors.primarySoft },
  archiveCard: { gap: spacing.lg, borderColor: colors.dangerSoft },
  archiveCopy: { gap: spacing.xs },
  archiveTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  archiveText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  archiveButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
  archiveButtonDisabled: { opacity: 0.7 },
  archiveButtonText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionCount: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  classList: { gap: spacing.md },
  emptyClassesTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  emptyClassesCopy: { marginTop: 6, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
