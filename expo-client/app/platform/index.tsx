import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import {
  buildInviteUrl,
  listPlatformInvites,
  listPlatformWorkspaces,
  PlatformInvite,
  PlatformWorkspace,
} from '@/features/platform/platformService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlatformAdminScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);
  const [invites, setInvites] = useState<PlatformInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const instituteTypeLabels = useMemo(
    (): Record<InstituteType, string> => ({
      solo: t('platformAdmin.typeSolo'),
      academy: t('platformAdmin.typeAcademy'),
      institute: t('platformAdmin.typeInstitute'),
    }),
    [t],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextWorkspaces, nextInvites] = await Promise.all([listPlatformWorkspaces(), listPlatformInvites()]);
      setWorkspaces(nextWorkspaces);
      setInvites(nextInvites);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'platformAdmin.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  async function copyInviteLink(token: string) {
    const url = buildInviteUrl(token);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  }

  const openInvites = invites.filter((invite) => !invite.usedAt).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('platformAdmin.title')}</Text>
            <Text style={styles.subtitle}>{t('platformAdmin.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <MaterialCommunityIcons name="shield-crown-outline" size={28} color="white" />
          <Text style={styles.heroTitle}>{t('platformAdmin.heroTitle')}</Text>
          <Text style={styles.heroNote}>
            {isLoading
              ? t('platformAdmin.heroLoading')
              : interpolate(t('platformAdmin.heroNote'), { workspaces: workspaces.length, invites: openInvites })}
          </Text>
        </LinearGradient>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/platform/invites/new' as Href)}>
          <MaterialCommunityIcons name="link-plus" size={20} color="white" />
          <Text style={styles.primaryButtonText}>{t('platformAdmin.createInvite')}</Text>
        </Pressable>

        {error ? (
          <PremiumCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('platformAdmin.workspacesTitle')}</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : workspaces.length === 0 ? (
            <Text style={styles.emptyText}>{t('platformAdmin.emptyWorkspaces')}</Text>
          ) : (
            workspaces.map((workspace) => (
              <View key={workspace.workspaceId} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{workspace.workspaceName}</Text>
                  <Text style={styles.rowMeta}>
                    {instituteTypeLabels[workspace.instituteType as InstituteType] ?? workspace.instituteType}
                    {workspace.academySector ? ` • ${workspace.academySector}` : ''} •{' '}
                    {workspace.ownerEmail || t('platformAdmin.noOwnerEmail')}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {interpolate(t('platformAdmin.membersMeta'), {
                      count: workspace.memberCount,
                      date: formatDate(workspace.createdAt),
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </PremiumCard>

        <PremiumCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('platformAdmin.invitesTitle')}</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : invites.length === 0 ? (
            <Text style={styles.emptyText}>{t('platformAdmin.emptyInvites')}</Text>
          ) : (
            invites.map((invite) => (
              <View key={invite.id} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>
                    {instituteTypeLabels[invite.instituteType as InstituteType] ?? invite.instituteType}
                    {invite.academySector ? ` • ${invite.academySector}` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {invite.workspaceNameHint || t('platformAdmin.noNameHint')}
                    {invite.email ? ` • ${interpolate(t('platformAdmin.lockedToEmail'), { email: invite.email })}` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {invite.usedAt
                      ? interpolate(t('platformAdmin.inviteUsed'), { date: formatDate(invite.usedAt) })
                      : interpolate(t('platformAdmin.inviteExpires'), { date: formatDate(invite.expiresAt) })}
                  </Text>
                </View>
                {!invite.usedAt ? (
                  <Pressable style={styles.copyButton} onPress={() => void copyInviteLink(invite.token)}>
                    <Text style={styles.copyButtonText}>
                      {copiedToken === invite.token ? t('platformAdmin.copied') : t('platformAdmin.copyLink')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, gap: spacing.sm },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  heroNote: { color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  sectionCard: { gap: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  rowMeta: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  copyButton: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  copyButtonText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  errorCard: { backgroundColor: '#FFF5F5' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
});
