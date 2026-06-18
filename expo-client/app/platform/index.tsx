import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlatformAdminScreen() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);
  const [invites, setInvites] = useState<PlatformInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextWorkspaces, nextInvites] = await Promise.all([listPlatformWorkspaces(), listPlatformInvites()]);
      setWorkspaces(nextWorkspaces);
      setInvites(nextInvites);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load platform data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
            <Text style={styles.title}>Platform admin</Text>
            <Text style={styles.subtitle}>Provision customers, invite links and workspace overview.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <MaterialCommunityIcons name="shield-crown-outline" size={28} color="white" />
          <Text style={styles.heroTitle}>ClassFlow operator console</Text>
          <Text style={styles.heroNote}>
            {isLoading ? 'Loading…' : `${workspaces.length} workspaces • ${invites.filter((i) => !i.usedAt).length} open invites`}
          </Text>
        </LinearGradient>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/platform/invites/new' as Href)}>
          <MaterialCommunityIcons name="link-plus" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Create customer invite</Text>
        </Pressable>

        {error ? (
          <PremiumCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Workspaces</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : workspaces.length === 0 ? (
            <Text style={styles.emptyText}>No workspaces yet.</Text>
          ) : (
            workspaces.map((workspace) => (
              <View key={workspace.workspaceId} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{workspace.workspaceName}</Text>
                  <Text style={styles.rowMeta}>
                    {workspace.instituteType}
                    {workspace.academySector ? ` • ${workspace.academySector}` : ''} • {workspace.ownerEmail || 'no owner email'}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {workspace.memberCount} members • {formatDate(workspace.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </PremiumCard>

        <PremiumCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent invites</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : invites.length === 0 ? (
            <Text style={styles.emptyText}>No invites created yet.</Text>
          ) : (
            invites.map((invite) => (
              <View key={invite.id} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>
                    {invite.instituteType}
                    {invite.academySector ? ` • ${invite.academySector}` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {invite.workspaceNameHint || 'No name hint'}
                    {invite.email ? ` • locked to ${invite.email}` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {invite.usedAt ? `Used ${formatDate(invite.usedAt)}` : `Expires ${formatDate(invite.expiresAt)}`}
                  </Text>
                </View>
                {!invite.usedAt ? (
                  <Pressable style={styles.copyButton} onPress={() => void copyInviteLink(invite.token)}>
                    <Text style={styles.copyButtonText}>{copiedToken === invite.token ? 'Copied' : 'Copy link'}</Text>
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
