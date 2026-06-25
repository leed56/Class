import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { useAuth } from '@/core/auth/AuthProvider';
import { getCurrentWorkspace, updateWorkspace } from '@/features/auth/authService';
import { useWorkspaceRole } from '@/features/auth/useWorkspaceRole';
import { getTeacherDisplayName, getTeacherInitials } from '@/features/auth/teacherProfile';
import { roleLabel } from '@/features/auth/permissions';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageCode, InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { role, hasPermission } = useWorkspaceRole();
  const { locale, setLocale, t } = useI18n();
  const [workspaceName, setWorkspaceName] = useState(t('common.yourWorkspace'));
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [instituteType, setInstituteType] = useState<InstituteType>('solo');
  const [isLoading, setIsLoading] = useState(true);
  const [savingLanguage, setSavingLanguage] = useState(false);

  const displayName = getTeacherDisplayName(user);
  const initials = getTeacherInitials(user);
  const phone =
    typeof user?.user_metadata?.phone === 'string' && user.user_metadata.phone.trim()
      ? user.user_metadata.phone.trim()
      : t('common.notSet');

  const heroLabel = useMemo(
    () =>
      role
        ? interpolate(t('settings.teacherWorkspaceWithRole'), { role: roleLabel(role, t) })
        : t('more.teacherWorkspace'),
    [role, t],
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const workspace = await getCurrentWorkspace();
      setWorkspaceName(workspace?.name ?? t('common.yourWorkspace'));
      setDefaultLanguage(workspace?.default_language ?? 'en');
      setInstituteType(workspace?.institute_type ?? 'solo');
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  async function handleLanguageChange(next: LanguageCode) {
    setSavingLanguage(true);
    try {
      await setLocale(next);
      setDefaultLanguage(next);
      if (hasPermission('manage_settings')) {
        await updateWorkspace({ defaultLanguage: next });
      }
    } finally {
      setSavingLanguage(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/more" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
          </View>
          {hasPermission('manage_settings') ? (
            <Link href="/settings/edit" asChild>
              <Pressable style={styles.iconButton}>
                <MaterialCommunityIcons name="account-edit-outline" size={22} color={colors.primary} />
              </Pressable>
            </Link>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.avatarMark}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{heroLabel}</Text>
            <Text style={styles.heroTitle}>{isLoading ? t('common.loading') : workspaceName}</Text>
            <Text style={styles.heroNote}>{t('more.heroNote')}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.profileCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('settings.teacherProfile')}</Text>
              <Text style={styles.cardSubtitle}>{t('settings.profileSubtitle')}</Text>
            </View>
            <MaterialCommunityIcons name="account-edit-outline" size={24} color={colors.primary} />
          </View>
          {hasPermission('manage_settings') ? (
            <>
              <Link href="/settings/edit" asChild>
                <Pressable>
                  <SettingValue label={t('settings.displayName')} value={displayName} icon="account-outline" />
                </Pressable>
              </Link>
              <View style={styles.divider} />
              <Link href="/settings/edit" asChild>
                <Pressable>
                  <SettingValue label={t('settings.instituteName')} value={workspaceName} icon="school-outline" />
                </Pressable>
              </Link>
              <View style={styles.divider} />
              <Link href="/settings/edit" asChild>
                <Pressable>
                  <SettingValue label={t('settings.mobileNumber')} value={phone} icon="phone-outline" />
                </Pressable>
              </Link>
            </>
          ) : (
            <>
              <SettingValue label={t('settings.displayName')} value={displayName} icon="account-outline" />
              <View style={styles.divider} />
              <SettingValue label={t('settings.instituteName')} value={workspaceName} icon="school-outline" />
              <View style={styles.divider} />
              <SettingValue label={t('settings.mobileNumber')} value={phone} icon="phone-outline" />
            </>
          )}
        </PremiumCard>

        <PremiumCard style={styles.languageCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('settings.language')}</Text>
              <Text style={styles.cardSubtitle}>{t('settings.languageHint')}</Text>
            </View>
            <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
          </View>
          <View style={styles.languageRow}>
            <LanguageChip label={t('settings.english')} active={locale === 'en'} onPress={() => void handleLanguageChange('en')} disabled={savingLanguage} />
            <LanguageChip label={t('settings.sinhala')} active={locale === 'si'} onPress={() => void handleLanguageChange('si')} disabled={savingLanguage} />
            <LanguageChip label={t('settings.tamil')} active={locale === 'ta'} onPress={() => void handleLanguageChange('ta')} disabled={savingLanguage} />
          </View>
          {defaultLanguage !== locale ? (
            <Text style={styles.languageNote}>{t('settings.workspaceLanguage')}: {defaultLanguage.toUpperCase()}</Text>
          ) : null}
        </PremiumCard>

        <PremiumCard style={styles.receiptCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('settings.receiptBranding')}</Text>
              <Text style={styles.cardSubtitle}>{t('settings.receiptBrandingSubtitle')}</Text>
            </View>
            <MaterialCommunityIcons name="receipt-text-edit-outline" size={24} color={colors.success} />
          </View>
          <SettingValue label={t('settings.receiptPrefix')} value="RCPT" icon="identifier" />
          <View style={styles.divider} />
          <SettingValue label={t('settings.footerNote')} value={t('settings.footerNoteSample')} icon="note-text-outline" />
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>{t('settings.preview')}</Text>
            <Text style={styles.previewTitle}>{workspaceName}</Text>
            <Text style={styles.previewText}>{t('settings.previewReceiptSample')}</Text>
          </View>
        </PremiumCard>

        {hasPermission('manage_catalog') || hasPermission('view_reports') ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('settings.academicSetup')}</Text>
              {hasPermission('manage_catalog') ? (
                <Link href="/settings/subjects" asChild>
                  <Pressable>
                    <Text style={styles.sectionAction}>{t('settings.manage')}</Text>
                  </Pressable>
                </Link>
              ) : null}
            </View>
            <View style={styles.grid}>
              {hasPermission('manage_catalog') ? (
                <>
                  <SetupTile title={t('subjectsSetup.title')} subtitle={t('settings.tileSubjectsSubtitle')} icon="book-education-outline" color={colors.primary} href="/settings/subjects" />
                  <SetupTile title={t('catalog.title')} subtitle={t('settings.tileCatalogSubtitle')} icon="book-open-page-variant" color={colors.info} href="/settings/catalog" />
                  {instituteType === 'institute' ? (
                    <>
                      <SetupTile title={t('timetableBoard.title')} subtitle={t('settings.tileTimetableSubtitle')} icon="calendar-clock" color={colors.info} href={'/settings/timetable-board' as Href} />
                      <SetupTile title={t('branches.title')} subtitle={t('settings.tileBranchesSubtitle')} icon="source-branch" color={colors.primary} href="/settings/branches" />
                    </>
                  ) : null}
                  {hasPermission('manage_hall_rent') ? (
                    <SetupTile title={t('sidebar.hallRent')} subtitle={t('settings.tileHallRentSubtitle')} icon="cash-clock" color={colors.danger} href="/settings/hall-rent" />
                  ) : null}
                  <SetupTile title={t('certTemplates.title')} subtitle={t('settings.tileCertificatesSubtitle')} icon="certificate-outline" color={colors.warning} href="/settings/certificate-templates" />
                </>
              ) : null}
              {hasPermission('take_attendance') ? (
                <SetupTile title={t('tabs.classes')} subtitle={t('settings.tileClassesSubtitle')} icon="google-classroom" color={colors.success} href="/(tabs)/classes" />
              ) : null}
              {hasPermission('record_payments') ? (
                <SetupTile title={t('settings.tileFeeRules')} subtitle={t('settings.tileFeeRulesSubtitle')} icon="cash-multiple" color={colors.warning} href="/(tabs)/fees" />
              ) : null}
              {hasPermission('view_reports') ? (
                <SetupTile title={t('common.reports')} subtitle={t('settings.tileReportsSubtitle')} icon="file-chart-outline" color={colors.info} href="/reports" />
              ) : null}
            </View>
          </>
        ) : null}

        {hasPermission('manage_staff') ? (
          <Link href="/settings/staff" asChild>
            <Pressable>
              <PremiumCard style={styles.staffCard}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primarySoft }]}>
                  <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.cardTitle}>{t('staff.title')}</Text>
                  <Text style={styles.cardSubtitle}>{t('staff.subtitle')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
              </PremiumCard>
            </Pressable>
          </Link>
        ) : null}

        {hasPermission('archive_records') ? (
          <Link href="/settings/archived" asChild>
            <Pressable>
              <PremiumCard style={styles.archiveCard}>
                <View style={[styles.settingIcon, { backgroundColor: colors.warningSoft }]}>
                  <MaterialCommunityIcons name="archive-outline" size={20} color={colors.warning} />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.cardTitle}>{t('archivedRecords.title')}</Text>
                  <Text style={styles.cardSubtitle}>{t('archivedRecords.subtitle')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
              </PremiumCard>
            </Pressable>
          </Link>
        ) : null}

        <PremiumCard style={styles.policyCard}>
          <View style={styles.policyIcon}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.policyCopy}>
            <Text style={styles.cardTitle}>{t('settings.privacyTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('settings.privacySubtitle')}</Text>
          </View>
          <View style={styles.policyBadge}>
            <Text style={styles.policyBadgeText}>{t('settings.pdpaBadge')}</Text>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.commsCard}>
          <Text style={styles.cardTitle}>{t('settings.commsSetupTitle')}</Text>
          <Text style={styles.cardSubtitle}>{t('settings.commsSetupSubtitle')}</Text>
          <SettingValue label={t('settings.whatsappLabel')} value={t('settings.phase2')} icon="whatsapp" success />
          <View style={styles.divider} />
          <SettingValue label={t('settings.smsFallback')} value={t('settings.later')} icon="message-processing-outline" />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingValue({ label, value, icon, success = false }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; success?: boolean }) {
  const tone = success ? colors.success : colors.primary;
  const bg = success ? colors.successSoft : colors.primarySoft;
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={tone} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
    </View>
  );
}

function LanguageChip({
  label,
  active = false,
  onPress,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.languageChip, active && styles.languageChipActive, disabled && styles.languageChipDisabled]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SetupTile({
  title,
  subtitle,
  icon,
  color,
  href,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  href?: Href;
}) {
  const tile = (
    <PremiumCard style={styles.setupTile}>
      <View style={[styles.setupIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.setupTitle}>{title}</Text>
      <Text style={styles.setupSubtitle}>{subtitle}</Text>
    </PremiumCard>
  );

  if (!href) return tile;

  return (
    <Link href={href} asChild>
      <Pressable style={styles.setupTilePressable}>{tile}</Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  iconButtonPlaceholder: { width: 46, height: 46 },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  avatarMark: { width: 62, height: 62, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  avatarText: { color: 'white', fontSize: 20, fontWeight: '900' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  profileCard: { gap: spacing.sm },
  languageCard: { gap: spacing.lg },
  receiptCard: { gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  settingRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  settingIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  settingValue: { marginTop: 3, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  languageRow: { flexDirection: 'row', gap: spacing.sm },
  languageChip: { flex: 1, minHeight: 45, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  languageChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  languageChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '900' },
  languageChipTextActive: { color: 'white' },
  languageChipDisabled: { opacity: 0.6 },
  languageNote: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  previewBox: { marginTop: spacing.md, borderRadius: radius.xl, padding: spacing.lg, backgroundColor: colors.background },
  previewLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  previewTitle: { marginTop: 4, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  previewText: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  setupTilePressable: { width: '48%' },
  setupTile: { width: '100%', minHeight: 142, justifyContent: 'space-between', padding: spacing.lg },
  setupIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  setupTitle: { marginTop: spacing.md, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  setupSubtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  archiveCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.warningSoft },
  staffCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  policyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  policyIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  policyCopy: { flex: 1 },
  policyBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.primarySoft },
  policyBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  commsCard: { gap: spacing.sm },
});
