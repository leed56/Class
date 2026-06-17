import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { getClassById } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { issueCertificatesBulk, CertificateType } from '@/features/certificates/certificateService';
import { listClassRoster, ClassRosterEntry } from '@/features/enrollment/enrollmentService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function certificateTypeLabel(type: CertificateType) {
  return type === 'completion' ? 'Completion' : 'Achievement';
}

export default function ClassCertificatesScreen() {
  const params = useLocalSearchParams<{ classId: string }>();
  const [tuitionClass, setTuitionClass] = useState<TuitionClass | null>(null);
  const [roster, setRoster] = useState<ClassRosterEntry[]>([]);
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [certificateType, setCertificateType] = useState<CertificateType>('completion');
  const [title, setTitle] = useState('Class Completion Certificate');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const backHref = (`/classes/${params.classId}` as Href);
  const isEnabled = workspaceType !== 'solo';
  const typeChoice = useMemo(() => certificateTypeLabel(certificateType), [certificateType]);

  const load = useCallback(async () => {
    if (!params.classId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [nextClass, nextRoster, workspace] = await Promise.all([
        getClassById(params.classId),
        listClassRoster(params.classId),
        getCurrentWorkspace(),
      ]);
      setTuitionClass(nextClass);
      setRoster(nextRoster);
      setWorkspaceType(workspace?.institute_type ?? 'solo');
      if (nextClass) {
        setTitle(`${nextClass.subject} Grade ${nextClass.grade} ${certificateTypeLabel(certificateType)} Certificate`);
      } else {
        setLoadError('Class not found.');
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load class certificates.');
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, certificateType]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function handleTypeSelect(label: string) {
    const nextType: CertificateType = label === 'Achievement' ? 'achievement' : 'completion';
    setCertificateType(nextType);
    if (tuitionClass) {
      setTitle(`${tuitionClass.subject} Grade ${tuitionClass.grade} ${label} Certificate`);
    }
  }

  async function handleIssueAll() {
    setIsIssuing(true);
    setFormError(null);
    try {
      await issueCertificatesBulk({
        studentIds: roster.map((entry) => entry.student.id),
        certificateType,
        title,
        note,
      });
      setNote('');
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not issue certificates.');
    } finally {
      setIsIssuing(false);
    }
  }

  function confirmIssueAll() {
    if (!tuitionClass) return;
    Alert.alert(
      'Issue certificates?',
      `Issue ${certificateTypeLabel(certificateType)} certificates to ${roster.length} students in ${tuitionClass.subject} G${tuitionClass.grade}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Issue all', onPress: handleIssueAll },
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

  if (loadError || !tuitionClass) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{loadError ?? 'Class not found.'}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to class</Text>
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
            <Text style={styles.title}>Class Certificates</Text>
            <Text style={styles.subtitle}>Bulk issue completion or achievement certificates for this class.</Text>
          </View>
        </View>

        {!isEnabled ? (
          <PremiumCard>
            <EmptyState
              icon="certificate-outline"
              title="Available for academy and institute"
              message="Switch your workspace type from Settings to enable certifications."
              actionLabel="Back to class"
              actionHref={backHref}
            />
          </PremiumCard>
        ) : roster.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-group-outline"
              title="No students enrolled"
              message="Enroll students in this class before issuing certificates."
              actionLabel="Back to class"
              actionHref={backHref}
            />
          </PremiumCard>
        ) : (
          <>
            <PremiumCard style={styles.formCard}>
              <Text style={styles.cardTitle}>Bulk issue setup</Text>
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
                placeholder="Term, batch or exam context"
                icon="note-text-outline"
                value={note}
                onChangeText={setNote}
              />
              <View style={styles.summaryPill}>
                <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.primary} />
                <Text style={styles.summaryText}>{roster.length} students selected</Text>
              </View>
              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
              <Pressable style={[styles.issueButton, isIssuing && styles.issueButtonDisabled]} onPress={confirmIssueAll} disabled={isIssuing}>
                {isIssuing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="certificate" size={18} color="white" />
                    <Text style={styles.issueButtonText}>Issue to all students</Text>
                  </>
                )}
              </Pressable>
            </PremiumCard>

            <PremiumCard style={styles.listCard}>
              <Text style={styles.cardTitle}>Class roster</Text>
              <View style={styles.list}>
                {roster.map((entry) => (
                  <View key={entry.enrollmentId} style={styles.row}>
                    <View style={styles.rowAvatar}>
                      <Text style={styles.rowAvatarText}>
                        {entry.student.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowName}>{entry.student.name}</Text>
                      <Text style={styles.rowMeta}>Grade {entry.student.grade} • {entry.student.medium}</Text>
                    </View>
                  </View>
                ))}
              </View>
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
  formCard: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  summaryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 11, paddingVertical: 7 },
  summaryText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  formErrorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  issueButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary },
  issueButtonDisabled: { opacity: 0.7 },
  issueButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  listCard: { gap: spacing.md },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  rowAvatar: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  rowAvatarText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  rowCopy: { flex: 1 },
  rowName: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  rowMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
