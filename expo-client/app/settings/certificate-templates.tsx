import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace, updateWorkspace } from '@/features/auth/authService';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { PLACEHOLDERS } from '@/features/certificates/certificatePdf';
import { getSectorCertificatePreset, listSectorCertificatePresets } from '@/features/certificates/certificateSectorPresets';
import { FormTextField } from '@/features/students/components/FormTextField';
import { InstituteType } from '@/lib/database.types';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
  const templateDefaults = useMemo(
    () => ({
      signatoryTitle: t('certTemplates.signatoryTitlePlaceholder'),
      completionBody: t('certTemplates.defaultCompletionBody'),
      achievementBody: t('certTemplates.defaultAchievementBody'),
      footerNote: t('certTemplates.footerPlaceholder'),
    }),
    [t],
  );
  const [instituteType, setInstituteType] = useState<InstituteType>('solo');
  const [academySector, setAcademySector] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [completionBody, setCompletionBody] = useState('');
  const [achievementBody, setAchievementBody] = useState('');
  const [footerNote, setFooterNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await getCurrentWorkspace();
      setInstituteType(workspace?.institute_type ?? 'solo');
      setAcademySector(workspace?.academy_sector ?? null);
      setWorkspaceName(workspace?.name ?? '');
      setSignatoryName(workspace?.certificate_signatory_name ?? '');
      setSignatoryTitle(workspace?.certificate_signatory_title ?? templateDefaults.signatoryTitle);
      setCompletionBody(workspace?.certificate_completion_body ?? templateDefaults.completionBody);
      setAchievementBody(workspace?.certificate_achievement_body ?? templateDefaults.achievementBody);
      setFooterNote(workspace?.certificate_footer_note ?? templateDefaults.footerNote);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'certTemplates.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t, templateDefaults]);

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
      setError(resolveServiceErrorMessage(saveError, t, 'certTemplates.saveFailed'));
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
          <Text style={styles.blockedTitle}>{t('certTemplates.blockedTitle')}</Text>
          <Text style={styles.blockedText}>{t('certTemplates.blockedText')}</Text>
          <Link href="/settings/edit" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('certTemplates.changeWorkspace')}</Text>
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
            <Text style={styles.title}>{t('certTemplates.title')}</Text>
            <Text style={styles.subtitle}>{t('certTemplates.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{t('certTemplates.heroLabel')}</Text>
          <Text style={styles.heroTitle}>{workspaceName}</Text>
          <Text style={styles.heroNote}>{t('certTemplates.heroNote')}</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('certTemplates.sectorPresets')}</Text>
          <Text style={styles.cardHint}>
            {interpolate(t('certTemplates.sectorHint'), { sector: academySector ?? 'school_tuition' })}
          </Text>
          <View style={styles.presetRow}>
            {listSectorCertificatePresets(academySector).map((preset) => (
              <Pressable
                key={preset.label}
                style={styles.presetChip}
                onPress={() => {
                  setSignatoryTitle(preset.signatoryTitle);
                  setCompletionBody(preset.completionBody);
                  setAchievementBody(preset.achievementBody);
                  setFooterNote(preset.footerNote);
                }}
              >
                <Text style={styles.presetChipText}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.presetChip}
            onPress={() => {
              const preset = getSectorCertificatePreset(academySector);
              setSignatoryTitle(preset.signatoryTitle);
              setCompletionBody(preset.completionBody);
              setAchievementBody(preset.achievementBody);
              setFooterNote(preset.footerNote);
            }}
          >
            <Text style={styles.presetChipText}>{t('certTemplates.resetSector')}</Text>
          </Pressable>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('certTemplates.signatory')}</Text>
          <FormTextField
            label={t('certTemplates.signatoryName')}
            placeholder={t('certTemplates.signatoryNamePlaceholder')}
            icon="account-tie-outline"
            value={signatoryName}
            onChangeText={setSignatoryName}
          />
          <FormTextField
            label={t('certTemplates.signatoryTitle')}
            placeholder={t('certTemplates.signatoryTitlePlaceholder')}
            icon="badge-account-outline"
            value={signatoryTitle}
            onChangeText={setSignatoryTitle}
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('certTemplates.completionWording')}</Text>
          <Text style={styles.cardHint}>{interpolate(t('certTemplates.placeholdersHint'), { list: PLACEHOLDERS.join(', ') })}</Text>
          <FormTextField
            label={t('certTemplates.completionBody')}
            placeholder={t('certTemplates.completionPlaceholder')}
            icon="text-box-outline"
            value={completionBody}
            onChangeText={setCompletionBody}
            multiline
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('certTemplates.achievementWording')}</Text>
          <FormTextField
            label={t('certTemplates.achievementBody')}
            placeholder={t('certTemplates.completionPlaceholder')}
            icon="trophy-outline"
            value={achievementBody}
            onChangeText={setAchievementBody}
            multiline
          />
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('certTemplates.footer')}</Text>
          <FormTextField
            label={t('certTemplates.footerNote')}
            placeholder={t('certTemplates.footerPlaceholder')}
            icon="note-text-outline"
            value={footerNote}
            onChangeText={setFooterNote}
          />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <Text style={styles.saveNote}>{t('certTemplates.saveNote')}</Text>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>{t('certTemplates.saveTemplates')}</Text>
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
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetChip: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  presetChipText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
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
