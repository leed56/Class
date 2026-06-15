import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { CommandTile } from '@/features/more/components/CommandTile';
import { SettingsRow } from '@/features/more/components/SettingsRow';
import { integrationCommands, reportCommands, setupCommands } from '@/features/more/data/moreItems';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>More</Text>
            <Text style={styles.subtitle}>Reports, settings, communication and account controls.</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>NP</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="school" size={30} color="white" />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Nimal Perera Classes</Text>
            <Text style={styles.heroValue}>Starter-ready setup</Text>
            <Text style={styles.heroNote}>Trilingual UI foundation • Cash receipts • Parent consent tracking</Text>
          </View>
        </LinearGradient>

        <View style={styles.healthRow}>
          <PremiumCard style={styles.healthCard}>
            <Text style={styles.healthLabel}>Data Health</Text>
            <Text style={styles.healthValue}>92%</Text>
            <Text style={styles.healthNote}>1 consent pending</Text>
          </PremiumCard>
          <PremiumCard style={styles.healthCard}>
            <Text style={styles.healthLabel}>Plan</Text>
            <Text style={styles.healthValue}>Free</Text>
            <Text style={styles.healthNote}>30 student limit</Text>
          </PremiumCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reports</Text>
          <Text style={styles.sectionAction}>Export later</Text>
        </View>
        <View style={styles.commandGrid}>
          {reportCommands.map((item) => (
            <CommandTile key={item.id} item={item} />
          ))}
        </View>

        <PremiumCard style={styles.panelCard}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Setup</Text>
            <View style={styles.panelBadge}>
              <Text style={styles.panelBadgeText}>MVP</Text>
            </View>
          </View>
          {setupCommands.map((item, index) => (
            <View key={item.id}>
              <SettingsRow item={item} />
              {index < setupCommands.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </PremiumCard>

        <PremiumCard style={styles.panelCard}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Communication & billing</Text>
            <View style={styles.panelBadgeSuccess}>
              <Text style={styles.panelBadgeSuccessText}>Phase 2+</Text>
            </View>
          </View>
          {integrationCommands.map((item, index) => (
            <View key={item.id}>
              <SettingsRow item={item} />
              {index < integrationCommands.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </PremiumCard>

        <PremiumCard style={styles.signoutCard}>
          <View style={styles.signoutIcon}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.signoutTextBlock}>
            <Text style={styles.signoutTitle}>Secure teacher account</Text>
            <Text style={styles.signoutCopy}>Supabase Auth, tenant isolation and RLS will protect this workspace before production.</Text>
          </View>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 32,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 280,
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  hero: {
    minHeight: 142,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.hero,
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroLabel: {
    color: '#E7DEFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroValue: {
    marginTop: 4,
    color: 'white',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroNote: {
    marginTop: 6,
    color: '#E7DEFF',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  healthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  healthCard: {
    flex: 1,
    padding: spacing.lg,
  },
  healthLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  healthValue: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  healthNote: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  panelCard: {
    paddingTop: spacing.lg,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  panelBadge: {
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  panelBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  panelBadgeSuccess: {
    borderRadius: 999,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  panelBadgeSuccessText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  signoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.primarySoft,
  },
  signoutIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signoutTextBlock: {
    flex: 1,
  },
  signoutTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  signoutCopy: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
});
