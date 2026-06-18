import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { buildCertificateMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function certificateTypeLabel(value: StudentCertificate['certificateType']) {
  return value === 'completion' ? 'Completion' : 'Achievement';
}

function printActionLabel(action: CertificatePrint['action']) {
  if (action === 'download') return 'Downloaded PDF';
  if (action === 'share') return 'Shared via WhatsApp';
  return 'Reprinted PDF';
}

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
  const params = useLocalSearchParams<{ studentId: string; certificateId: string }>();
  const { hasPermission } = useWorkspaceRole();
  const [student, setStudent] = useState<Student | null>(null);
  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [template, setTemplate] = useState(getCertificateTemplateFromWorkspace(null));
  const [prints, setPrints] = useState<CertificatePrint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backHref = (`/students/${params.studentId}/certificates` as Href);
  const revoked = certificate ? isCertificateRevoked(certificate) : false;

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
      setWorkspaceName(workspace?.name ?? 'Your workspace');
      setTemplate(getCertificateTemplateFromWorkspace(workspace));
      setPrints(nextPrints);
      if (!nextStudent || !nextCertificate) {
        setError('Certificate not found.');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load certificate.');
    } finally {
      setIsLoading(false);
    }
  }, [params.certificateId, params.studentId]);

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
      setError(downloadError instanceof Error ? downloadError.message : 'Could not export certificate PDF.');
    } finally {
      setIsWorking(false);
    }
  }

  async function shareCertificate() {
    if (!student || !certificate) return;
    if (revoked) {
      setError('Revoked certificates cannot be shared.');
      return;
    }

    const message = buildCertificateMessage({
      workspaceName,
      studentName: student.name,
      certificateType: certificateTypeLabel(certificate.certificateType),
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
      setError(logError instanceof Error ? logError.message : 'Share sent but history was not saved.');
    }
  }

  function confirmRevoke() {
    if (!certificate || revoked) return;
    Alert.alert(
      'Revoke certificate?',
      'Parents should no longer treat this certificate as valid. PDF exports will show a revoked watermark.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setIsWorking(true);
            setError(null);
            try {
              const updated = await revokeCertificate(certificate.id);
              setCertificate(updated);
              await load();
            } catch (revokeError) {
              setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke certificate.');
            } finally {
              setIsWorking(false);
            }
          },
        },
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

  if (error && (!student || !certificate)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Certificate not found.'}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to certificates</Text>
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
            <Text style={styles.title}>Certificate</Text>
            <Text style={styles.subtitle}>Download PDF, share with parents, or revoke if issued in error.</Text>
          </View>
        </View>

        <LinearGradient
          colors={revoked ? [colors.danger, '#B42318'] : [colors.primaryDark, colors.primary]}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="certificate-outline"
              size={30}
              color="white"
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>
              {revoked ? 'Revoked certificate' : `${certificateTypeLabel(certificate.certificateType)} certificate`}
            </Text>
            <Text style={styles.heroTitle}>{certificate.serialNo}</Text>
            <Text style={styles.heroNote}>{formatCertificateDate(certificate.issuedOn)}</Text>
          </View>
        </LinearGradient>

        {revoked ? (
          <PremiumCard style={styles.revokedCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.danger} />
            <View style={styles.revokedCopy}>
              <Text style={styles.revokedTitle}>This certificate has been revoked</Text>
              <Text style={styles.revokedText}>
                {certificate.revokeReason?.trim() || 'Sharing and new parent confirmations are blocked.'}
              </Text>
            </View>
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{workspaceName}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{certificateTypeLabel(certificate.certificateType)}</Text>
            </View>
          </View>
          <View style={styles.details}>
            <DetailRow label="Student" value={student.name} />
            <DetailRow label="Title" value={certificate.title} />
            <DetailRow label="Serial" value={certificate.serialNo} />
            <DetailRow label="Issued on" value={formatCertificateDate(certificate.issuedOn)} />
            <DetailRow label="Signatory" value={template.signatoryName.trim() || 'Not set'} />
            {certificate.note ? <DetailRow label="Note" value={certificate.note} /> : null}
          </View>
        </PremiumCard>

        <Pressable onPress={shareCertificate} disabled={revoked}>
          <PremiumCard style={revoked ? { ...styles.shareCard, ...styles.disabledCard } : styles.shareCard}>
            <View style={styles.shareIcon}>
              <MaterialCommunityIcons name="whatsapp" size={24} color={revoked ? colors.textSecondary : colors.success} />
            </View>
            <View style={styles.shareCopy}>
              <Text style={styles.cardTitle}>Share with parent</Text>
              <Text style={styles.shareSubtitle}>
                {revoked ? 'Revoked certificates cannot be shared.' : `Send confirmation to ${student.parentPhone}.`}
              </Text>
            </View>
            {!revoked ? (
              <View style={styles.shareButtonSmall}>
                <Text style={styles.shareButtonSmallText}>Share</Text>
              </View>
            ) : null}
          </PremiumCard>
        </Pressable>

        <PremiumCard style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>Reprint history</Text>
            <Text style={styles.historyCount}>{prints.length}</Text>
          </View>
          {prints.length === 0 ? (
            <Text style={styles.historyEmpty}>No downloads or shares recorded yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {prints.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <Text style={styles.historyAction}>{printActionLabel(item.action)}</Text>
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
                <Text style={styles.revokeTitle}>Revoke certificate</Text>
                <Text style={styles.revokeText}>Use if issued in error. PDF exports will show a revoked watermark.</Text>
              </View>
            </PremiumCard>
          </Pressable>
        ) : null}

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{revoked ? 'Revoked' : 'Certificate PDF'}</Text>
          <Text style={styles.saveValue}>{certificate.serialNo}</Text>
        </View>
        <View style={styles.saveActions}>
          {prints.length > 0 ? (
            <Pressable
              style={[styles.secondaryButton, isWorking && styles.buttonDisabled]}
              onPress={() => handleDownloadPdf(true)}
              disabled={isWorking}
            >
              <Text style={styles.secondaryButtonText}>Reprint</Text>
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
                <Text style={styles.saveButtonText}>Download PDF</Text>
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
