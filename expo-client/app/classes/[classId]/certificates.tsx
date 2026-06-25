import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { getClassById } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import {
  issueCertificatesBulk,
  CertificateType,
  getCertificateEligibilityForStudents,
  CertificateEligibility,
} from '@/features/certificates/certificateService';
import { listClassRoster, ClassRosterEntry } from '@/features/enrollment/enrollmentService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { InstituteType, Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ClassCertificatesScreen() {
  return (
    <PermissionGate permission="issue_certificates">
      <ClassCertificatesContent />
    </PermissionGate>
  );
}

function ClassCertificatesContent() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ classId: string }>();
  const [tuitionClass, setTuitionClass] = useState<TuitionClass | null>(null);
  const [roster, setRoster] = useState<ClassRosterEntry[]>([]);
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [certificateType, setCertificateType] = useState<CertificateType>('completion');
  const [title, setTitle] = useState(t('certificates.classCompletionDefault'));
  const [note, setNote] = useState('');
  const [eligibilityByStudent, setEligibilityByStudent] = useState<Record<string, CertificateEligibility>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const backHref = (`/classes/${params.classId}` as Href);
  const isEnabled = workspaceType !== 'solo';

  const typeLabels = useMemo(
    () => ({
      completion: t('certificates.typeCompletion'),
      achievement: t('certificates.typeAchievement'),
    }),
    [t],
  );

  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };

  const typeChoice = typeLabels[certificateType];
  const eligibleCount = useMemo(
    () => roster.filter((entry) => eligibilityByStudent[entry.student.id]?.eligible).length,
    [eligibilityByStudent, roster],
  );
  const blockedCount = Math.max(0, roster.length - eligibleCount);

  const buildTitle = useCallback(
    (cls: TuitionClass, type: CertificateType) =>
      interpolate(t('certificates.titleTemplate'), {
        subject: cls.subject,
        grade: cls.grade,
        type: typeLabels[type],
      }),
    [t, typeLabels],
  );

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
      if ((workspace?.institute_type ?? 'solo') !== 'solo' && nextRoster.length > 0) {
        const eligibilityMap = await getCertificateEligibilityForStudents(
          nextRoster.map((entry) => entry.student.id),
        );
        const nextEligibility: Record<string, CertificateEligibility> = {};
        for (const [studentId, eligibility] of eligibilityMap.entries()) {
          nextEligibility[studentId] = eligibility;
        }
        setEligibilityByStudent(nextEligibility);
      } else {
        setEligibilityByStudent({});
      }
      if (nextClass) {
        setTitle(buildTitle(nextClass, certificateType));
      } else {
        setLoadError(t('certificates.classNotFound'));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('certificates.loadClassFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, certificateType, buildTitle, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function handleTypeSelect(label: string) {
    const nextType: CertificateType = label === typeLabels.achievement ? 'achievement' : 'completion';
    setCertificateType(nextType);
    if (tuitionClass) {
      setTitle(buildTitle(tuitionClass, nextType));
    }
  }

  async function handleIssueAll() {
    setIsIssuing(true);
    setFormError(null);
    try {
      const result = await issueCertificatesBulk({
        studentIds: roster.map((entry) => entry.student.id),
        certificateType,
        title,
        note,
      });
      let message = interpolate(t('certificates.issuedAlertBody'), { issued: result.issued.length });
      if (result.blocked.length > 0) {
        message += ` ${
          result.blocked.length === 1
            ? t('certificates.issuedAlertBlockedSingle')
            : interpolate(t('certificates.issuedAlertBlockedMulti'), { count: result.blocked.length })
        }`;
      } else {
        message += ` ${t('certificates.issuedAlertAllEligible')}`;
      }
      Alert.alert(t('certificates.issuedAlertTitle'), message);
      setNote('');
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('certificates.issueFailed'));
    } finally {
      setIsIssuing(false);
    }
  }

  function confirmIssueAll() {
    if (!tuitionClass) return;
    const blockedSuffix =
      blockedCount > 0 ? interpolate(t('certificates.blockedSuffix'), { count: blockedCount }) : '';
    Alert.alert(
      t('certificates.confirmIssueAllTitle'),
      interpolate(t('certificates.confirmIssueAllMessage'), {
        type: typeLabels[certificateType],
        eligible: eligibleCount,
        subject: tuitionClass.subject,
        grade: tuitionClass.grade,
        blockedSuffix,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('certificates.issueAll'), onPress: handleIssueAll },
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
          <Text style={styles.errorText}>{loadError ?? t('certificates.classNotFound')}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('certificates.backToClass')}</Text>
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
            <Text style={styles.title}>{t('certificates.classTitle')}</Text>
            <Text style={styles.subtitle}>{t('certificates.classSubtitle')}</Text>
          </View>
        </View>

        {!isEnabled ? (
          <PremiumCard>
            <EmptyState
              icon="certificate-outline"
              title={t('certificates.academyOnlyTitle')}
              message={t('certificates.academyOnlyMessage')}
              actionLabel={t('certificates.backToClass')}
              actionHref={backHref}
            />
          </PremiumCard>
        ) : roster.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="account-group-outline"
              title={t('certificates.noStudentsTitle')}
              message={t('certificates.noStudentsMessage')}
              actionLabel={t('certificates.backToClass')}
              actionHref={backHref}
            />
          </PremiumCard>
        ) : (
          <>
            <PremiumCard style={styles.formCard}>
              <Text style={styles.cardTitle}>{t('certificates.bulkSetupTitle')}</Text>
              <ChoiceChipGroup
                label={t('certificates.typeLabel')}
                options={[typeLabels.completion, typeLabels.achievement]}
                selected={typeChoice}
                onSelect={handleTypeSelect}
              />
              <FormTextField
                label={t('certificates.titleLabel')}
                placeholder={t('certificates.titlePlaceholder')}
                icon="certificate-outline"
                value={title}
                onChangeText={setTitle}
              />
              <FormTextField
                label={t('certificates.noteLabel')}
                placeholder={t('certificates.notePlaceholderClass')}
                icon="note-text-outline"
                value={note}
                onChangeText={setNote}
              />
              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <MaterialCommunityIcons name="account-check-outline" size={16} color={colors.success} />
                  <Text style={[styles.summaryText, { color: colors.success }]}>
                    {interpolate(t('certificates.eligibleCount'), { count: eligibleCount })}
                  </Text>
                </View>
                <View style={styles.summaryPill}>
                  <MaterialCommunityIcons name="account-alert-outline" size={16} color={colors.danger} />
                  <Text style={[styles.summaryText, { color: colors.danger }]}>
                    {interpolate(t('certificates.blockedCount'), { count: blockedCount })}
                  </Text>
                </View>
              </View>
              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
              <Pressable
                style={[styles.issueButton, (isIssuing || eligibleCount === 0) && styles.issueButtonDisabled]}
                onPress={confirmIssueAll}
                disabled={isIssuing || eligibleCount === 0}
              >
                {isIssuing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="certificate" size={18} color="white" />
                    <Text style={styles.issueButtonText}>{t('certificates.issueToAll')}</Text>
                  </>
                )}
              </Pressable>
            </PremiumCard>

            <PremiumCard style={styles.listCard}>
              <Text style={styles.cardTitle}>{t('certificates.rosterTitle')}</Text>
              <View style={styles.list}>
                {roster.map((entry) => {
                  const medium = mediumLabels[entry.student.medium as Medium] ?? entry.student.medium;
                  return (
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
                        <Text style={styles.rowMeta}>
                          {interpolate(t('certificates.gradeMeta'), {
                            grade: entry.student.grade,
                            medium,
                          })}
                        </Text>
                        {eligibilityByStudent[entry.student.id] ? (
                          <>
                            <View
                              style={[
                                styles.eligibilityBadge,
                                {
                                  backgroundColor: eligibilityByStudent[entry.student.id].eligible
                                    ? colors.successSoft
                                    : colors.dangerSoft,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.eligibilityBadgeText,
                                  {
                                    color: eligibilityByStudent[entry.student.id].eligible
                                      ? colors.success
                                      : colors.danger,
                                  },
                                ]}
                              >
                                {eligibilityByStudent[entry.student.id].eligible
                                  ? t('certificates.eligible')
                                  : t('certificates.blocked')}
                              </Text>
                            </View>
                            {!eligibilityByStudent[entry.student.id].eligible ? (
                              <Text style={styles.blockerText}>
                                {eligibilityByStudent[entry.student.id].blockers[0]}
                              </Text>
                            ) : null}
                          </>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
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
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 11, paddingVertical: 7 },
  summaryText: { fontSize: 11, fontWeight: '900' },
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
  eligibilityBadge: { marginTop: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  eligibilityBadgeText: { fontSize: 10, fontWeight: '900' },
  blockerText: { marginTop: 5, color: colors.danger, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
