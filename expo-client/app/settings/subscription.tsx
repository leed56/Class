import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const currentStudents = 5;
const freeLimit = 30;
const usagePercent = Math.round((currentStudents / freeLimit) * 100);

export default function SubscriptionScreen() {
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
            <Text style={styles.title}>Subscription</Text>
            <Text style={styles.subtitle}>Manage limits, plan features and billing readiness for ClassFlow.</Text>
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
            <Text style={styles.heroLabel}>Current plan</Text>
            <Text style={styles.heroTitle}>Free teacher workspace</Text>
            <Text style={styles.heroNote}>{currentStudents}/{freeLimit} students used • Upgrade-ready SaaS foundation</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.usageCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Usage summary</Text>
              <Text style={styles.cardSubtitle}>Student limit controls for the Free plan</Text>
            </View>
            <Text style={styles.usagePercent}>{usagePercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
          </View>
          <View style={styles.usageStatsRow}>
            <UsageFigure label="Students" value={`${currentStudents}`} />
            <UsageFigure label="Limit" value={`${freeLimit}`} />
            <UsageFigure label="Remaining" value={`${freeLimit - currentStudents}`} />
          </View>
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plans</Text>
          <Text style={styles.sectionAction}>Compare</Text>
        </View>

        <View style={styles.planList}>
          <PlanCard title="Free" price="LKR 0" badge="Current" description="For early teacher testing and small student lists." color={colors.primary} features={['30 students', 'Attendance tracking', 'Cash fee records']} />
          <PlanCard title="Starter" price="LKR 1,500/mo" badge="Recommended" description="For solo tuition teachers ready to run monthly operations." color={colors.success} features={['300 students', 'WhatsApp reminders', 'Receipt sharing']} featured />
          <PlanCard title="Institute" price="Custom" badge="Later" description="For multi-teacher institutes with branches and admin controls." color={colors.warning} features={['Multiple teachers', 'Branch reports', 'Advanced exports']} />
        </View>

        <PremiumCard style={styles.billingCard}>
          <View style={styles.billingIcon}>
            <MaterialCommunityIcons name="credit-card-clock-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.billingCopy}>
            <Text style={styles.cardTitle}>Billing placeholder</Text>
            <Text style={styles.cardSubtitle}>Payments can be connected later through local gateways or manual invoice collection.</Text>
          </View>
          <View style={styles.phaseBadge}><Text style={styles.phaseBadgeText}>Later</Text></View>
        </PremiumCard>

        <PremiumCard style={styles.featureCard}>
          <Text style={styles.cardTitle}>Feature availability</Text>
          <Text style={styles.cardSubtitle}>Clear SaaS gates for production without blocking MVP usage.</Text>
          <FeatureRow label="Attendance and student management" state="Included" included />
          <View style={styles.divider} />
          <FeatureRow label="Fee records and receipt preview" state="Included" included />
          <View style={styles.divider} />
          <FeatureRow label="Automated WhatsApp reminders" state="Starter" />
          <View style={styles.divider} />
          <FeatureRow label="Institute admin dashboard" state="Institute" />
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Recommended upgrade</Text>
          <Text style={styles.saveValue}>Starter plan</Text>
        </View>
        <View style={styles.saveButton}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="white" />
          <Text style={styles.saveButtonText}>Upgrade</Text>
        </View>
      </View>
    </SafeAreaView>
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
