import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { useAuth } from '@/core/auth/AuthProvider';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { getTeacherDisplayName, getTeacherInitials } from '@/features/auth/teacherProfile';
import { LanguageCode } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  const displayName = getTeacherDisplayName(user);
  const initials = getTeacherInitials(user);
  const phone =
    typeof user?.user_metadata?.phone === 'string' && user.user_metadata.phone.trim()
      ? user.user_metadata.phone.trim()
      : 'Not set';

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const workspace = await getCurrentWorkspace();
      setWorkspaceName(workspace?.name ?? 'Your workspace');
      setDefaultLanguage(workspace?.default_language ?? 'en');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/more" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Teacher profile, language, receipts, subjects and communication controls.</Text>
          </View>
          <Link href="/settings/edit" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="account-edit-outline" size={22} color={colors.primary} />
            </Pressable>
          </Link>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.avatarMark}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Teacher workspace</Text>
            <Text style={styles.heroTitle}>{isLoading ? 'Loading…' : workspaceName}</Text>
            <Text style={styles.heroNote}>Cash receipts • Attendance • Parent consent controls</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.profileCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Teacher profile</Text>
              <Text style={styles.cardSubtitle}>Used in receipts, reports and parent messages</Text>
            </View>
            <MaterialCommunityIcons name="account-edit-outline" size={24} color={colors.primary} />
          </View>
          <Link href="/settings/edit" asChild>
            <Pressable>
              <SettingValue label="Display name" value={displayName} icon="account-outline" />
            </Pressable>
          </Link>
          <View style={styles.divider} />
          <Link href="/settings/edit" asChild>
            <Pressable>
              <SettingValue label="Institute name" value={workspaceName} icon="school-outline" />
            </Pressable>
          </Link>
          <View style={styles.divider} />
          <Link href="/settings/edit" asChild>
            <Pressable>
              <SettingValue label="Mobile number" value={phone} icon="phone-outline" />
            </Pressable>
          </Link>
        </PremiumCard>

        <PremiumCard style={styles.languageCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Language</Text>
              <Text style={styles.cardSubtitle}>Trilingual foundation for Sri Lankan tuition teachers</Text>
            </View>
            <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
          </View>
          <View style={styles.languageRow}>
            <LanguageChip label="English" active={defaultLanguage === 'en'} />
            <LanguageChip label="සිංහල" active={defaultLanguage === 'si'} />
            <LanguageChip label="தமிழ்" active={defaultLanguage === 'ta'} />
          </View>
        </PremiumCard>

        <PremiumCard style={styles.receiptCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Receipt branding</Text>
              <Text style={styles.cardSubtitle}>Controls shown on every payment receipt</Text>
            </View>
            <MaterialCommunityIcons name="receipt-text-edit-outline" size={24} color={colors.success} />
          </View>
          <SettingValue label="Receipt prefix" value="RCPT" icon="identifier" />
          <View style={styles.divider} />
          <SettingValue label="Footer note" value="Thank you for your payment" icon="note-text-outline" />
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Preview</Text>
            <Text style={styles.previewTitle}>{workspaceName}</Text>
            <Text style={styles.previewText}>Receipt no: RCPT-0004 • LKR 2,500</Text>
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Academic setup</Text>
          <Text style={styles.sectionAction}>Manage</Text>
        </View>
        <View style={styles.grid}>
          <SetupTile title="Subjects" subtitle="Maths, Science, English" icon="book-education-outline" color={colors.primary} />
          <SetupTile title="Classes" subtitle="Grade, medium, hall" icon="google-classroom" color={colors.success} />
          <SetupTile title="Fee rules" subtitle="Monthly fee defaults" icon="cash-multiple" color={colors.warning} />
          <SetupTile title="Reports" subtitle="Export preferences" icon="file-chart-outline" color={colors.info} />
        </View>

        <Link href="/settings/archived" asChild>
          <Pressable>
            <PremiumCard style={styles.archiveCard}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warningSoft }]}>
                <MaterialCommunityIcons name="archive-outline" size={20} color={colors.warning} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.cardTitle}>Archived records</Text>
                <Text style={styles.cardSubtitle}>View and restore hidden students and classes</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
            </PremiumCard>
          </Pressable>
        </Link>

        <PremiumCard style={styles.policyCard}>
          <View style={styles.policyIcon}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.policyCopy}>
            <Text style={styles.cardTitle}>Privacy & consent</Text>
            <Text style={styles.cardSubtitle}>Parent consent tracking, data retention and communication permissions for production readiness.</Text>
          </View>
          <View style={styles.policyBadge}><Text style={styles.policyBadgeText}>PDPA-aware</Text></View>
        </PremiumCard>

        <PremiumCard style={styles.commsCard}>
          <Text style={styles.cardTitle}>Communication setup</Text>
          <Text style={styles.cardSubtitle}>Integrations prepared for later production phases</Text>
          <SettingValue label="WhatsApp / ReachWA" value="Phase 2" icon="whatsapp" success />
          <View style={styles.divider} />
          <SettingValue label="SMS fallback" value="Later" icon="message-processing-outline" />
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

function LanguageChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.languageChip, active && styles.languageChipActive]}>
      <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>{label}</Text>
    </View>
  );
}

function SetupTile({ title, subtitle, icon, color }: { title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.setupTile}>
      <View style={[styles.setupIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.setupTitle}>{title}</Text>
      <Text style={styles.setupSubtitle}>{subtitle}</Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
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
  previewBox: { marginTop: spacing.md, borderRadius: radius.xl, padding: spacing.lg, backgroundColor: colors.background },
  previewLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  previewTitle: { marginTop: 4, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  previewText: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  setupTile: { width: '48%', minHeight: 142, justifyContent: 'space-between', padding: spacing.lg },
  setupIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  setupTitle: { marginTop: spacing.md, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  setupSubtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  archiveCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.warningSoft },
  policyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  policyIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  policyCopy: { flex: 1 },
  policyBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.primarySoft },
  policyBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  commsCard: { gap: spacing.sm },
});
