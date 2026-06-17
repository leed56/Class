import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  CertificateType,
  CertificateEligibility,
  formatCertificateDate,
  getCertificateEligibilityForStudents,
  isCertificateRevoked,
  issueCertificate,
  listStudentCertificates,
  StudentCertificate,
} from '@/features/certificates/certificateService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { getStudentById } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function certificateTypeLabel(type: CertificateType) {
  return type === 'completion' ? 'Completion' : 'Achievement';
}

export default function StudentCertificatesScreen() {
  const params = useLocalSearchParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [items, setItems] = useState<StudentCertificate[]>([]);
  const [certificateType, setCertificateType] = useState<CertificateType>('completion');
  const [title, setTitle] = useState('Course Completion Certificate');
  const [note, setNote] = useState('');
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const backHref = (`/students/${params.studentId}` as Href);
  const isEnabled = workspaceType !== 'solo';
  const typeChoice = useMemo(() => certificateTypeLabel(certificateType), [certificateType]);

  const load = useCallback(async () => {
    if (!params.studentId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [nextStudent, workspace, certificates] = await Promise.all([
        getStudentById(params.studentId),
        getCurrentWorkspace(),
        listStudentCertificates(params.studentId),
      ]);
      setStudent(nextStudent);
      setWorkspaceType(workspace?.institute_type ?? 'solo');
      setItems(certificates);
      if ((workspace?.institute_type ?? 'solo') !== 'solo' && nextStudent?.id) {
        const eligibilityMap = await getCertificateEligibilityForStudents([nextStudent.id]);
        setEligibility(eligibilityMap.get(nextStudent.id) ?? null);
      } else {
        setEligibility(null);
      }
      if (!nextStudent) setLoadError('Student not found.');
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : 'Could not load certifications.');
    } finally {
      setIsLoading(false);
    }
  }, [params.studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function handleTypeSelect(label: string) {
    const nextType: CertificateType = label === 'Achievement' ? 'achievement' : 'completion';
    setCertificateType(nextType);
    setTitle(nextType === 'completion' ? 'Course Completion Certificate' : 'Achievement Certificate');
  }

  async function handleIssue() {
    if (!params.studentId) return;
    setIsIssuing(true);
    setFormError(null);
    try {
      await issueCertificate({
        studentId: params.studentId,
        certificateType,
        title,
        note,
      });
      setNote('');
      await load();
    } catch (issueError) {
      setFormError(issueError instanceof Error ? issueError.message : 'Could not issue certificate.');
    } finally {
      setIsIssuing(false);
    }
  }

  function confirmIssue() {
    if (!student) return;
    if (eligibility && !eligibility.eligible) {
      setFormError(eligibility.blockers[0] ?? 'Student is not eligible for certification.');
      return;
    }
    Alert.alert(
      'Issue certificate?',
      `${certificateTypeLabel(certificateType)} for ${student.name} will be recorded now.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Issue', onPress: handleIssue },
      ],
    );
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

  if (!student || loadError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{loadError ?? 'Student not found.'}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to student</Text>
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
          <Link href={backHref} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Certifications</Text>
            <Text style={styles.subtitle}>Issue and track certificates for academy and institute students.</Text>
          </View>
        </View>

        {!isEnabled ? (
          <PremiumCard>
            <EmptyState
              icon="certificate-outline"
              title="Available for academy and institute"
              message="Switch your workspace type from Settings to enable certifications."
              actionLabel="Back to student"
              actionHref={backHref}
            />
          </PremiumCard>
        ) : (
          <>
            {eligibility ? (
              <PremiumCard style={styles.eligibilityCard}>
                <Text style={styles.cardTitle}>Eligibility</Text>
                <View style={styles.eligibilityRow}>
                  <Text style={styles.eligibilityLabel}>Attendance</Text>
                  <Text style={styles.eligibilityValue}>{eligibility.attendancePercent}%</Text>
                </View>
                <View style={styles.eligibilityRow}>
                  <Text style={styles.eligibilityLabel}>Outstanding fees</Text>
                  <Text style={styles.eligibilityValue}>LKR {eligibility.outstandingAmount.toLocaleString('en-LK')}</Text>
                </View>
                <View
                  style={[
                    styles.eligibilityBadge,
                    { backgroundColor: eligibility.eligible ? colors.successSoft : colors.dangerSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.eligibilityBadgeText,
                      { color: eligibility.eligible ? colors.success : colors.danger },
                    ]}
                  >
                    {eligibility.eligible ? 'Eligible to certify' : 'Blocked by rules'}
                  </Text>
                </View>
                {!eligibility.eligible ? (
                  <Text style={styles.blockerText}>{eligibility.blockers[0]}</Text>
                ) : null}
              </PremiumCard>
            ) : null}

            <PremiumCard style={styles.formCard}>
              <Text style={styles.cardTitle}>Issue certificate</Text>
              <ChoiceChipGroup
                label="Type"
                options={['Completion', 'Achievement']}
                selected={typeChoice}
                onSelect={handleTypeSelect}
              />
              <FormTextField
                label="Title"
                placeholder="Certificate title"
                icon="certificate-outline"
                value={title}
                onChangeText={setTitle}
              />
              <FormTextField
                label="Note (optional)"
                placeholder="Batch, term, or exam details"
                icon="note-text-outline"
                value={note}
                onChangeText={setNote}
              />
              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
              <Pressable
                style={[styles.issueButton, (isIssuing || (eligibility != null && !eligibility.eligible)) && styles.issueButtonDisabled]}
                onPress={confirmIssue}
                disabled={isIssuing || (eligibility != null && !eligibility.eligible)}
              >
                {isIssuing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="certificate" size={18} color="white" />
                    <Text style={styles.issueButtonText}>Issue certificate</Text>
                  </>
                )}
              </Pressable>
            </PremiumCard>

            <PremiumCard style={styles.listCard}>
              <View style={styles.listHeader}>
                <Text style={styles.cardTitle}>Issued certificates</Text>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
              {items.length === 0 ? (
                <Text style={styles.emptyText}>No certificates issued yet for this student.</Text>
              ) : (
                <View style={styles.list}>
                  {items.map((item) => (
                    <NavPressable
                      key={item.id}
                      href={`/students/${params.studentId}/certificates/${item.id}` as Href}
                      style={styles.row}
                    >
                      <View style={styles.rowIcon}>
                        <MaterialCommunityIcons name="certificate-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={styles.rowCopy}>
                        <View style={styles.rowTitleRow}>
                          <Text style={styles.rowTitle}>{item.title}</Text>
                          {isCertificateRevoked(item) ? (
                            <View style={styles.revokedBadge}>
                              <Text style={styles.revokedBadgeText}>Revoked</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.rowMeta}>
                          {certificateTypeLabel(item.certificateType)} • {item.serialNo} • {formatCertificateDate(item.issuedOn)}
                        </Text>
                        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </NavPressable>
                  ))}
                </View>
              )}
            </PremiumCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  eligibilityCard: { gap: spacing.sm },
  formCard: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  eligibilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eligibilityLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  eligibilityValue: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  eligibilityBadge: { marginTop: 4, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  eligibilityBadgeText: { fontSize: 11, fontWeight: '900' },
  blockerText: { color: colors.danger, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  issueButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary },
  issueButtonDisabled: { opacity: 0.7 },
  issueButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  listCard: { gap: spacing.lg },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  rowIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  rowCopy: { flex: 1 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  rowTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  revokedBadge: { borderRadius: 999, backgroundColor: colors.dangerSoft, paddingHorizontal: 8, paddingVertical: 4 },
  revokedBadgeText: { color: colors.danger, fontSize: 10, fontWeight: '900' },
  rowMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  rowNote: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  formErrorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
