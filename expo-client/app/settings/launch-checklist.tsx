import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const completedItems = 7;
const totalItems = 12;
const readinessPercent = Math.round((completedItems / totalItems) * 100);

function LaunchChecklistScreenContent() {
  const { t } = useI18n();

  const checklistItems = [
    { title: t('launchChecklist.check1Title'), subtitle: t('launchChecklist.check1Subtitle'), state: t('launchChecklist.stateDone'), icon: 'cellphone' as const, done: true },
    { title: t('launchChecklist.check2Title'), subtitle: t('launchChecklist.check2Subtitle'), state: t('launchChecklist.stateNext'), icon: 'database-outline' as const },
    { title: t('launchChecklist.check3Title'), subtitle: t('launchChecklist.check3Subtitle'), state: t('launchChecklist.stateNext'), icon: 'account-lock-outline' as const },
    { title: t('launchChecklist.check4Title'), subtitle: t('launchChecklist.check4Subtitle'), state: t('launchChecklist.statePlanned'), icon: 'cloud-sync-outline' as const },
    { title: t('launchChecklist.check5Title'), subtitle: t('launchChecklist.check5Subtitle'), state: t('launchChecklist.stateCheck'), icon: 'web' as const },
    { title: t('launchChecklist.check6Title'), subtitle: t('launchChecklist.check6Subtitle'), state: t('launchChecklist.stateNext'), icon: 'android' as const },
    { title: t('launchChecklist.check7Title'), subtitle: t('launchChecklist.check7Subtitle'), state: t('launchChecklist.stateReady'), icon: 'shield-check-outline' as const, done: true },
  ];

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
            <Text style={styles.title}>{t('launchChecklist.title')}</Text>
            <Text style={styles.subtitle}>{t('launchChecklist.subtitle')}</Text>
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
            <Text style={styles.heroLabel}>{t('launchChecklist.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{interpolate(t('launchChecklist.heroTitle'), { percent: readinessPercent })}</Text>
            <Text style={styles.heroNote}>
              {interpolate(t('launchChecklist.heroNote'), { completed: completedItems, total: totalItems })}
            </Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.progressCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('launchChecklist.progressTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('launchChecklist.progressSubtitle')}</Text>
            </View>
            <Text style={styles.progressPercent}>{readinessPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${readinessPercent}%` }]} />
          </View>
        </PremiumCard>

        <View style={styles.summaryRow}>
          <ReadinessMetric label={t('launchChecklist.metricDone')} value={`${completedItems}`} icon="check-decagram-outline" color={colors.success} />
          <ReadinessMetric label={t('launchChecklist.metricOpen')} value={`${totalItems - completedItems}`} icon="progress-clock" color={colors.warning} />
        </View>

        <PremiumCard style={styles.blockerCard}>
          <View style={styles.blockerIcon}>
            <MaterialCommunityIcons name="alert-decagram-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.blockerCopy}>
            <Text style={styles.cardTitle}>{t('launchChecklist.blockersTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('launchChecklist.blockersSubtitle')}</Text>
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('launchChecklist.sectionChecklist')}</Text>
          <Text style={styles.sectionAction}>{t('launchChecklist.sectionExport')}</Text>
        </View>

        <PremiumCard style={styles.checklistCard}>
          {checklistItems.map((item, index) => (
            <View key={item.title}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <ChecklistRow title={item.title} subtitle={item.subtitle} state={item.state} icon={item.icon} done={item.done} />
            </View>
          ))}
        </PremiumCard>

        <View style={styles.stageGrid}>
          <StageTile title={t('launchChecklist.stageBackend')} subtitle={t('launchChecklist.stageBackendSub')} icon="database-cog-outline" color={colors.primary} />
          <StageTile title={t('launchChecklist.stageTesting')} subtitle={t('launchChecklist.stageTestingSub')} icon="bug-check-outline" color={colors.warning} />
          <StageTile title={t('launchChecklist.stageDeploy')} subtitle={t('launchChecklist.stageDeploySub')} icon="rocket-launch-outline" color={colors.success} />
          <StageTile title={t('launchChecklist.stageStore')} subtitle={t('launchChecklist.stageStoreSub')} icon="storefront-outline" color={colors.info} />
        </View>

        <PremiumCard style={styles.nextCard}>
          <View style={styles.nextIcon}>
            <MaterialCommunityIcons name="database-plus-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.nextCopy}>
            <Text style={styles.cardTitle}>{t('launchChecklist.nextStepTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('launchChecklist.nextStepSubtitle')}</Text>
          </View>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function LaunchChecklistScreen() {
  return (
    <PermissionGate permission="manage_settings">
      <LaunchChecklistScreenContent />
    </PermissionGate>
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
