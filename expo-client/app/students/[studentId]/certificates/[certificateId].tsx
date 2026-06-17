import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  formatCertificateDate,
  getStudentCertificateById,
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

export default function CertificateDetailScreen() {
  const params = useLocalSearchParams<{ studentId: string; certificateId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backHref = (`/students/${params.studentId}/certificates` as Href);

  const load = useCallback(async () => {
    if (!params.studentId || !params.certificateId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextStudent, nextCertificate, workspace] = await Promise.all([
        getStudentById(params.studentId),
        getStudentCertificateById(params.studentId, params.certificateId),
        getCurrentWorkspace(),
      ]);
      setStudent(nextStudent);
      setCertificate(nextCertificate);
      setWorkspaceName(workspace?.name ?? 'Your workspace');
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

  async function shareCertificate() {
    if (!student || !certificate) return;

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

  if (error || !student || !certificate) {
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
            <Text style={styles.subtitle}>Review and share certificate details with parents.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="certificate-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{certificateTypeLabel(certificate.certificateType)} certificate</Text>
            <Text style={styles.heroTitle}>{certificate.serialNo}</Text>
            <Text style={styles.heroNote}>{formatCertificateDate(certificate.issuedOn)}</Text>
          </View>
        </LinearGradient>

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
            {certificate.note ? <DetailRow label="Note" value={certificate.note} /> : null}
          </View>
        </PremiumCard>

        <Pressable onPress={shareCertificate}>
          <PremiumCard style={styles.shareCard}>
            <View style={styles.shareIcon}>
              <MaterialCommunityIcons name="whatsapp" size={24} color={colors.success} />
            </View>
            <View style={styles.shareCopy}>
              <Text style={styles.cardTitle}>Share with parent</Text>
              <Text style={styles.shareSubtitle}>Send certificate confirmation to {student.parentPhone}.</Text>
            </View>
            <View style={styles.shareButtonSmall}>
              <Text style={styles.shareButtonSmallText}>Share</Text>
            </View>
          </PremiumCard>
        </Pressable>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Certificate</Text>
          <Text style={styles.saveValue}>{certificate.serialNo}</Text>
        </View>
        <Pressable style={styles.saveButton} onPress={shareCertificate}>
          <MaterialCommunityIcons name="share-variant" size={18} color="white" />
          <Text style={styles.saveButtonText}>Share</Text>
        </Pressable>
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
  shareIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  shareCopy: { flex: 1 },
  shareSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  shareButtonSmall: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.primary },
  shareButtonSmallText: { color: 'white', fontSize: 12, fontWeight: '900' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
