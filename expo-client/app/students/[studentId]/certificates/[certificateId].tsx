import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { useWorkspaceRole } from '@/features/auth/useWorkspaceRole';
import { downloadCertificatePdf } from '@/features/certificates/certificatePdf';
import {
  CertificatePrint,
  formatCertificateDate,
  getCertificateTemplateFromWorkspace,
  getStudentCertificateById,
  isCertificateRevoked,
  listCertificatePrints,
  logCertificatePrint,
  revokeCertificate,
  StudentCertificate,
} from '@/features/certificates/certificateService';
import { getStudentById } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { buildCertificateMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatPrintTime(value: string) {
  return new Date(value).toLocaleString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CertificateDetailScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ studentId: string; certificateId: string }>();
  const { hasPermission } = useWorkspaceRole();
  const [student, setStudent] = useState<Student | null>(null);
  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [workspaceName, setWorkspaceName] = useState(t('certificateDetail.workspaceFallback'));
  const [template, setTemplate] = useState(getCertificateTemplateFromWorkspace(null));
  const [prints, setPrints] = useState<CertificatePrint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backHref = (`/students/${params.studentId}/certificates` as Href);
  const revoked = certificate ? isCertificateRevoked(certificate) : false;

  const typeLabels = useMemo(
    () => ({
      completion: t('certificates.typeCompletion'),
      achievement: t('certificates.typeAchievement'),
    }),
    [t],
  );

  const printActionLabels = useMemo(
    (): Record<CertificatePrint['action'], string> => ({
      download: t('certificateDetail.printDownload'),
      share: t('certificateDetail.printShare'),
      reprint: t('certificateDetail.printReprint'),
    }),
    [t],
  );

  const load = useCallback(async () => {
    if (!params.studentId || !params.certificateId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextStudent, nextCertificate, workspace, nextPrints] = await Promise.all([
        getStudentById(params.studentId),
        getStudentCertificateById(params.studentId, params.certificateId),
        getCurrentWorkspace(),
        listCertificatePrints(params.certificateId),
      ]);
      setStudent(nextStudent);
      setCertificate(nextCertificate);
      setWorkspaceName(workspace?.name ?? t('certificateDetail.workspaceFallback'));
      setTemplate(getCertificateTemplateFromWorkspace(workspace));
      setPrints(nextPrints);
      if (!nextStudent || !nextCertificate) {
        setError(t('certificateDetail.notFound'));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('certificateDetail.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.certificateId, params.studentId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDownloadPdf(isReprint = false) {
    if (!student || !certificate) return;
    setIsWorking(true);
    setError(null);
    try {
      downloadCertificatePdf({
        studentName: student.name,
        certificateType: certificate.certificateType,
        title: certificate.title,
        serialNo: certificate.serialNo,
        issuedOn: formatCertificateDate(certificate.issuedOn),
        note: certificate.note,
        revoked,
        revokeReason: certificate.revokeReason,
        template: {
          workspaceName: template.workspaceName,
          signatoryName: template.signatoryName,
          signatoryTitle: template.signatoryTitle,
          completionBody: template.completionBody,
          achievementBody: template.achievementBody,
          footerNote: template.footerNote,
        },
      });
      await logCertificatePrint(certificate.id, isReprint ? 'reprint' : 'download');
      await load();
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : t('certificateDetail.exportFailed'));
    } finally {
      setIsWorking(false);
    }
  }

  async function shareCertificate() {
    if (!student || !certificate) return;
    if (revoked) {
      setError(t('certificateDetail.shareBlockedError'));
      return;
    }

    const message = buildCertificateMessage({
      workspaceName,
      studentName: student.name,
      certificateType: typeLabels[certificate.certificateType],
      title: certificate.title,
      serialNo: certificate.serialNo,
      issuedOn: formatCertificateDate(certificate.issuedOn),
      note: certificate.note,
    });

    await openWhatsAppChat(student.parentPhone, message);
    try {
      await logCertificatePrint(certificate.id, 'share');
      await load();
    } catch (logError) {
      setError(logError instanceof Error ? logError.message : t('certificateDetail.shareLogFailed'));
    }
  }

  function confirmRevoke() {
    if (!certificate || revoked) return;
    Alert.alert(t('certificateDetail.revokeConfirmTitle'), t('certificateDetail.revokeConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('certificateDetail.revoke'),
        style: 'destructive',
        onPress: async () => {
          setIsWorking(true);
          setError(null);
          try {
            const updated = await revokeCertificate(certificate.id);
            setCertificate(updated);
            await load();
          } catch (revokeError) {
            setError(revokeError instanceof Error ? revokeError.message : t('certificateDetail.revokeFailed'));
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
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

  if (error && (!student || !certificate)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? t('certificateDetail.notFound')}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('certificateDetail.backToCertificates')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!student || !certificate) return null;

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
            <Text style={styles.title}>{t('certificateDetail.title')}</Text>
            <Text style={styles.subtitle}>{t('certificateDetail.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient
          colors={revoked ? [colors.danger, '#B42318'] : [colors.primaryDark, colors.primary]}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="certificate-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>
              {revoked
                ? t('certificateDetail.heroRevoked')
                : interpolate(t('certificateDetail.heroActive'), { type: typeLabels[certificate.certificateType] })}
            </Text>
            <Text style={styles.heroTitle}>{certificate.serialNo}</Text>
            <Text style={styles.heroNote}>{formatCertificateDate(certificate.issuedOn)}</Text>
          </View>
        </LinearGradient>

        {revoked ? (
          <PremiumCard style={styles.revokedCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.danger} />
            <View style={styles.revokedCopy}>
              <Text style={styles.revokedTitle}>{t('certificateDetail.revokedTitle')}</Text>
              <Text style={styles.revokedText}>
                {certificate.revokeReason?.trim() || t('certificateDetail.revokedDefaultNote')}
              </Text>
            </View>
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{workspaceName}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{typeLabels[certificate.certificateType]}</Text>
            </View>
          </View>
          <View style={styles.details}>
            <DetailRow label={t('certificateDetail.studentLabel')} value={student.name} />
            <DetailRow label={t('certificateDetail.titleLabel')} value={certificate.title} />
            <DetailRow label={t('certificateDetail.serialLabel')} value={certificate.serialNo} />
            <DetailRow label={t('certificateDetail.issuedOnLabel')} value={formatCertificateDate(certificate.issuedOn)} />
            <DetailRow
              label={t('certificateDetail.signatoryLabel')}
              value={template.signatoryName.trim() || t('certificateDetail.notSet')}
            />
            {certificate.note ? <DetailRow label={t('certificateDetail.noteLabel')} value={certificate.note} /> : null}
          </View>
        </PremiumCard>

        <Pressable onPress={shareCertificate} disabled={revoked}>
          <PremiumCard style={revoked ? { ...styles.shareCard, ...styles.disabledCard } : styles.shareCard}>
            <View style={styles.shareIcon}>
              <MaterialCommunityIcons name="whatsapp" size={24} color={revoked ? colors.textSecondary : colors.success} />
            </View>
            <View style={styles.shareCopy}>
              <Text style={styles.cardTitle}>{t('certificateDetail.shareTitle')}</Text>
              <Text style={styles.shareSubtitle}>
                {revoked
                  ? t('certificateDetail.shareBlocked')
                  : interpolate(t('certificateDetail.shareSubtitle'), { phone: student.parentPhone })}
              </Text>
            </View>
            {!revoked ? (
              <View style={styles.shareButtonSmall}>
                <Text style={styles.shareButtonSmallText}>{t('certificateDetail.share')}</Text>
              </View>
            ) : null}
          </PremiumCard>
        </Pressable>

        <PremiumCard style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>{t('certificateDetail.historyTitle')}</Text>
            <Text style={styles.historyCount}>{prints.length}</Text>
          </View>
          {prints.length === 0 ? (
            <Text style={styles.historyEmpty}>{t('certificateDetail.historyEmpty')}</Text>
          ) : (
            <View style={styles.historyList}>
              {prints.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <Text style={styles.historyAction}>{printActionLabels[item.action]}</Text>
                  <Text style={styles.historyTime}>{formatPrintTime(item.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </PremiumCard>

        {!revoked && hasPermission('revoke_certificates') ? (
          <Pressable onPress={confirmRevoke} disabled={isWorking}>
            <PremiumCard style={styles.revokeCard}>
              <MaterialCommunityIcons name="cancel" size={22} color={colors.danger} />
              <View style={styles.revokedCopy}>
                <Text style={styles.revokeTitle}>{t('certificateDetail.revokeTitle')}</Text>
                <Text style={styles.revokeText}>{t('certificateDetail.revokeText')}</Text>
              </View>
            </PremiumCard>
          </Pressable>
        ) : null}

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>
            {revoked ? t('certificateDetail.saveLabelRevoked') : t('certificateDetail.saveLabelActive')}
          </Text>
          <Text style={styles.saveValue}>{certificate.serialNo}</Text>
        </View>
        <View style={styles.saveActions}>
          {prints.length > 0 ? (
            <Pressable
              style={[styles.secondaryButton, isWorking && styles.buttonDisabled]}
              onPress={() => handleDownloadPdf(true)}
              disabled={isWorking}
            >
              <Text style={styles.secondaryButtonText}>{t('certificateDetail.reprint')}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.saveButton, isWorking && styles.buttonDisabled]}
            onPress={() => handleDownloadPdf(false)}
            disabled={isWorking}
          >
            {isWorking ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-download-outline" size={18} color="white" />
                <Text style={styles.saveButtonText}>{t('certificateDetail.downloadPdf')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
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
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  revokedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderColor: colors.dangerSoft },
  revokedCopy: { flex: 1 },
  revokedTitle: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  revokedText: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  pill: { borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 7 },
  pillText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  details: { gap: spacing.md, borderRadius: radius.xl, padding: spacing.lg, backgroundColor: colors.background },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  detailLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  detailValue: { flex: 1, textAlign: 'right', color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  shareCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.successSoft },
  disabledCard: { opacity: 0.65 },
  shareIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  shareCopy: { flex: 1 },
  shareSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  shareButtonSmall: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.primary },
  shareButtonSmallText: { color: 'white', fontSize: 12, fontWeight: '900' },
  historyCard: { gap: spacing.md },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCount: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  historyEmpty: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  historyList: { gap: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  historyAction: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  historyTime: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  revokeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderColor: colors.dangerSoft },
  revokeTitle: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  revokeText: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  secondaryButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, backgroundColor: colors.surface },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  buttonDisabled: { opacity: 0.7 },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  inlineError: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
