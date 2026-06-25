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

const currentStudents = 5;
const freeLimit = 30;
const usagePercent = Math.round((currentStudents / freeLimit) * 100);

function SubscriptionScreenContent() {
  const { t } = useI18n();
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
            <Text style={styles.title}>{t('subscription.title')}</Text>
            <Text style={styles.subtitle}>{t('subscription.subtitle')}</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="crown-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="crown-outline" size={31} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('subscription.currentPlan')}</Text>
            <Text style={styles.heroTitle}>{t('subscription.freePlan')}</Text>
            <Text style={styles.heroNote}>{interpolate(t('subscription.heroNote'), { used: currentStudents, limit: freeLimit })}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.usageCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('subscription.usageTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('subscription.usageSubtitle')}</Text>
            </View>
            <Text style={styles.usagePercent}>{usagePercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
          </View>
          <View style={styles.usageStatsRow}>
            <UsageFigure label={t('subscription.students')} value={`${currentStudents}`} />
            <UsageFigure label={t('subscription.limit')} value={`${freeLimit}`} />
            <UsageFigure label={t('subscription.remaining')} value={`${freeLimit - currentStudents}`} />
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('subscription.plansTitle')}</Text>
          <Text style={styles.sectionAction}>{t('subscription.compare')}</Text>
        </View>

        <View style={styles.planList}>
          <PlanCard title={t('subscription.freeTitle')} price={t('subscription.freePrice')} badge={t('subscription.badgeCurrent')} description={t('subscription.freeDesc')} color={colors.primary} features={[t('subscription.freeFeature1'), t('subscription.freeFeature2'), t('subscription.freeFeature3')]} />
          <PlanCard title={t('subscription.starterTitle')} price={t('subscription.starterPrice')} badge={t('subscription.badgeRecommended')} description={t('subscription.starterDesc')} color={colors.success} features={[t('subscription.starterFeature1'), t('subscription.starterFeature2'), t('subscription.starterFeature3')]} featured />
          <PlanCard title={t('subscription.instituteTitle')} price={t('subscription.institutePrice')} badge={t('subscription.badgeLater')} description={t('subscription.instituteDesc')} color={colors.warning} features={[t('subscription.instituteFeature1'), t('subscription.instituteFeature2'), t('subscription.instituteFeature3')]} />
        </View>

        <PremiumCard style={styles.billingCard}>
          <View style={styles.billingIcon}>
            <MaterialCommunityIcons name="credit-card-clock-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.billingCopy}>
            <Text style={styles.cardTitle}>{t('subscription.billingTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('subscription.billingSubtitle')}</Text>
          </View>
          <View style={styles.phaseBadge}><Text style={styles.phaseBadgeText}>{t('subscription.badgeLater')}</Text></View>
        </PremiumCard>

        <PremiumCard style={styles.featureCard}>
          <Text style={styles.cardTitle}>{t('subscription.featureTitle')}</Text>
          <Text style={styles.cardSubtitle}>{t('subscription.featureSubtitle')}</Text>
          <FeatureRow label={t('subscription.featureAttendance')} state={t('subscription.included')} included />
          <View style={styles.divider} />
          <FeatureRow label={t('subscription.featureFees')} state={t('subscription.included')} included />
          <View style={styles.divider} />
          <FeatureRow label={t('subscription.featureWhatsapp')} state={t('subscription.starter')} />
          <View style={styles.divider} />
          <FeatureRow label={t('subscription.featureInstitute')} state={t('subscription.institute')} />
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('subscription.recommendedUpgrade')}</Text>
          <Text style={styles.saveValue}>{t('subscription.starterPlan')}</Text>
        </View>
        <View style={styles.saveButton}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="white" />
          <Text style={styles.saveButtonText}>{t('subscription.upgrade')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function SubscriptionScreen() {
  return (
    <PermissionGate permission="manage_settings">
      <SubscriptionScreenContent />
    </PermissionGate>
  );
}

function UsageFigure({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.usageFigure}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{value}</Text>
    </View>
  );
}

function PlanCard({ title, price, badge, description, color, features, featured = false }: { title: string; price: string; badge: string; description: string; color: string; features: string[]; featured?: boolean }) {
  return (
    <PremiumCard style={featured ? { ...styles.planCard, ...styles.featuredPlanCard } : styles.planCard}>
      <View style={styles.planTopRow}>
        <View style={[styles.planIcon, { backgroundColor: `${color}1F` }]}>
          <MaterialCommunityIcons name="crown-outline" size={23} color={color} />
        </View>
        <View style={[styles.planBadge, { backgroundColor: `${color}1F` }]}>
          <Text style={[styles.planBadgeText, { color }]}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={[styles.planPrice, { color }]}>{price}</Text>
      <Text style={styles.planDescription}>{description}</Text>
      <View style={styles.featureList}>
        {features.map((item) => (
          <View key={item} style={styles.planFeatureRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={color} />
            <Text style={styles.planFeatureText}>{item}</Text>
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}

function FeatureRow({ label, state, included = false }: { label: string; state: string; included?: boolean }) {
  const color = included ? colors.success : colors.primary;
  return (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons name={included ? 'check-circle-outline' : 'lock-open-outline'} size={20} color={color} />
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={[styles.featureState, { color }]}>{state}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
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
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  usageCard: { gap: spacing.lg },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  usagePercent: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.primarySoft },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
  usageStatsRow: { flexDirection: 'row', gap: spacing.sm },
  usageFigure: { flex: 1, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  usageLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  usageValue: { marginTop: 4, color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  planList: { gap: spacing.md },
  planCard: { gap: spacing.md },
  featuredPlanCard: { borderColor: colors.success },
  planTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  planBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  planBadgeText: { fontSize: 11, fontWeight: '900' },
  planTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  planPrice: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  planDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  featureList: { gap: spacing.sm },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planFeatureText: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  billingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  billingIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  billingCopy: { flex: 1 },
  phaseBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.primarySoft },
  phaseBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  featureCard: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  featureLabel: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  featureState: { fontSize: 11, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
