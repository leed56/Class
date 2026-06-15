import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const completedItems = 7;
const totalItems = 12;
const readinessPercent = Math.round((completedItems / totalItems) * 100);

export default function LaunchChecklistScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Launch Checklist</Text>
            <Text style={styles.subtitle}>Production readiness for mobile, web preview, security and store release.</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="shield-check-outline" size={31} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Production readiness</Text>
            <Text style={styles.heroTitle}>{readinessPercent}% launch-ready</Text>
            <Text style={styles.heroNote}>{completedItems}/{totalItems} checks prepared • MVP path is clear</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.progressCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Readiness progress</Text>
              <Text style={styles.cardSubtitle}>From prototype UI to installable teacher MVP</Text>
            </View>
            <Text style={styles.progressPercent}>{readinessPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${readinessPercent}%` }]} />
          </View>
        </PremiumCard>

        <View style={styles.summaryRow}>
          <ReadinessMetric label="Done" value={`${completedItems}`} icon="check-decagram-outline" color={colors.success} />
          <ReadinessMetric label="Open" value={`${totalItems - completedItems}`} icon="progress-clock" color={colors.warning} />
        </View>

        <PremiumCard style={styles.blockerCard}>
          <View style={styles.blockerIcon}>
            <MaterialCommunityIcons name="alert-decagram-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.blockerCopy}>
            <Text style={styles.cardTitle}>Main launch blockers</Text>
            <Text style={styles.cardSubtitle}>Supabase schema, real auth/RLS, route wiring, web build check and Android test build.</Text>
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Checklist</Text>
          <Text style={styles.sectionAction}>Export</Text>
        </View>

        <PremiumCard style={styles.checklistCard}>
          <ChecklistRow title="Expo app shell" subtitle="Tabs, routes and premium screens created" state="Done" icon="cellphone" done />
          <View style={styles.divider} />
          <ChecklistRow title="Supabase schema" subtitle="Students, classes, fees, attendance and tenant tables" state="Next" icon="database-outline" />
          <View style={styles.divider} />
          <ChecklistRow title="Auth + RLS" subtitle="Teacher login, workspace isolation and parent data safety" state="Next" icon="account-lock-outline" />
          <View style={styles.divider} />
          <ChecklistRow title="Offline-first attendance" subtitle="Save marks locally before syncing" state="Planned" icon="cloud-sync-outline" />
          <View style={styles.divider} />
          <ChecklistRow title="Vercel web preview" subtitle="Expo web export and preview deployment" state="Check" icon="web" />
          <View style={styles.divider} />
          <ChecklistRow title="Android APK" subtitle="EAS internal distribution build" state="Next" icon="android" />
          <View style={styles.divider} />
          <ChecklistRow title="Privacy & consent" subtitle="PDPA-aware consent capture and retention rules" state="Ready" icon="shield-check-outline" done />
        </PremiumCard>

        <View style={styles.stageGrid}>
          <StageTile title="Backend" subtitle="Supabase tables + policies" icon="database-cog-outline" color={colors.primary} />
          <StageTile title="Testing" subtitle="Typecheck, build, device QA" icon="bug-check-outline" color={colors.warning} />
          <StageTile title="Deploy" subtitle="Vercel web + EAS Android" icon="rocket-launch-outline" color={colors.success} />
          <StageTile title="Store" subtitle="Listing, screenshots, privacy" icon="storefront-outline" color={colors.info} />
        </View>

        <PremiumCard style={styles.nextCard}>
          <View style={styles.nextIcon}>
            <MaterialCommunityIcons name="database-plus-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.nextCopy}>
            <Text style={styles.cardTitle}>Recommended next build step</Text>
            <Text style={styles.cardSubtitle}>Create the Supabase schema and connect real data behind the premium UI.</Text>
          </View>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReadinessMetric({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={23} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </PremiumCard>
  );
}

function ChecklistRow({ title, subtitle, state, icon, done = false }: { title: string; subtitle: string; state: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; done?: boolean }) {
  const color = done ? colors.success : colors.primary;
  const bg = done ? colors.successSoft : colors.primarySoft;
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={21} color={color} />
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{title}</Text>
        <Text style={styles.checkSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.statePill, { backgroundColor: bg }]}>
        <Text style={[styles.stateText, { color }]}>{state}</Text>
      </View>
    </View>
  );
}

function StageTile({ title, subtitle, icon, color }: { title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.stageTile}>
      <View style={[styles.stageIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={23} color={color} />
      </View>
      <Text style={styles.stageTitle}>{title}</Text>
      <Text style={styles.stageSubtitle}>{subtitle}</Text>
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
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  progressCard: { gap: spacing.lg },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  progressPercent: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.primarySoft },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.success },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  metricCard: { flex: 1, padding: spacing.lg, gap: spacing.xs },
  metricIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  metricLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  metricValue: { fontSize: 25, fontWeight: '900' },
  blockerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.warningSoft },
  blockerIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warningSoft },
  blockerCopy: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  checklistCard: { gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  checkIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  checkCopy: { flex: 1 },
  checkTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  checkSubtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  statePill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  stateText: { fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  stageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stageTile: { width: '48%', minHeight: 142, justifyContent: 'space-between', padding: spacing.lg },
  stageIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  stageTitle: { marginTop: spacing.md, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  stageSubtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  nextIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  nextCopy: { flex: 1 },
});
