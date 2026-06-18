import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace, updateWorkspace } from '@/features/auth/authService';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getDefaultCertificateBodies, PLACEHOLDERS } from '@/features/certificates/certificatePdf';
import { FormTextField } from '@/features/students/components/FormTextField';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function CertificateTemplatesScreen() {
  return (
    <PermissionGate permission="manage_catalog">
      <CertificateTemplatesContent />
    </PermissionGate>
  );
}

function CertificateTemplatesContent() {
  const router = useRouter();
  const [instituteType, setInstituteType] = useState<InstituteType>('solo');
  const [workspaceName, setWorkspaceName] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('Director');
  const [completionBody, setCompletionBody] = useState(getDefaultCertificateBodies().completionBody);
  const [achievementBody, setAchievementBody] = useState(getDefaultCertificateBodies().achievementBody);
  const [footerNote, setFooterNote] = useState(getDefaultCertificateBodies().footerNote);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await getCurrentWorkspace();
      setInstituteType(workspace?.institute_type ?? 'solo');
      setWorkspaceName(workspace?.name ?? '');
      setSignatoryName(workspace?.certificate_signatory_name ?? '');
      setSignatoryTitle(workspace?.certificate_signatory_title ?? 'Director');
      setCompletionBody(workspace?.certificate_completion_body ?? getDefaultCertificateBodies().completionBody);
      setAchievementBody(workspace?.certificate_achievement_body ?? getDefaultCertificateBodies().achievementBody);
      setFooterNote(workspace?.certificate_footer_note ?? getDefaultCertificateBodies().footerNote);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load certificate templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await updateWorkspace({
        certificateSignatoryName: signatoryName,
        certificateSignatoryTitle: signatoryTitle,
        certificateCompletionBody: completionBody,
        certificateAchievementBody: achievementBody,
        certificateFooterNote: footerNote,
      });
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save certificate templates.');
    } finally {
      setIsSaving(false);
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

  if (instituteType === 'solo') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="certificate-outline" size={42} color={colors.primary} />
          <Text style={styles.blockedTitle}>Academy and institute only</Text>
          <Text style={styles.blockedText}>
            Certificate templates are available when your workspace type is Academy or Institute.
          </Text>
          <Link href="/settings/edit" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Change workspace type</Text>
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
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Certificate templates</Text>
            <Text style={styles.subtitle}>Branding, signatory and wording used on exported PDF certificates.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>PDF branding</Text>
          <Text style={styles.heroTitle}>{workspaceName}</Text>
          <Text style={styles.heroNote}>Parents receive official documents with your institute name and signatory.</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Signatory</Text>
          <FormTextField
            label="Signatory name"
            placeholder="Dr. Nimal Perera"
            icon="account-tie-outline"
            value={signatoryName}
            onChangeText={setSignatoryName}
          />
          <FormTextField
            label="Signatory title"
            placeholder="Director"
            icon="badge-account-outline"
            value={signatoryTitle}
            onChangeText={setSignatoryTitle}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Completion wording</Text>
          <Text style={styles.cardHint}>Placeholders: {PLACEHOLDERS.join(', ')}</Text>
          <FormTextField
            label="Completion body"
            placeholder="Certificate wording"
            icon="text-box-outline"
            value={completionBody}
            onChangeText={setCompletionBody}
            multiline
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Achievement wording</Text>
          <FormTextField
            label="Achievement body"
            placeholder="Certificate wording"
            icon="trophy-outline"
            value={achievementBody}
            onChangeText={setAchievementBody}
            multiline
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Footer</Text>
          <FormTextField
            label="Footer note"
            placeholder="Issued via ClassFlow"
            icon="note-text-outline"
            value={footerNote}
            onChangeText={setFooterNote}
          />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <Text style={styles.saveNote}>Used on every PDF export and reprint</Text>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>Save templates</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
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
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardHint: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  blockedTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  blockedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveNote: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
