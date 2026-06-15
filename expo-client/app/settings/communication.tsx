import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const templateCount = 4;
const consentReadyPercent = 82;

export default function CommunicationSetupScreen() {
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
            <Text style={styles.title}>Communication</Text>
            <Text style={styles.subtitle}>WhatsApp, SMS fallback, message templates and parent consent controls.</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="message-cog-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="whatsapp" size={31} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>ReachWA-ready setup</Text>
            <Text style={styles.heroTitle}>Parent communication hub</Text>
            <Text style={styles.heroNote}>{templateCount} templates prepared • {consentReadyPercent}% consent-ready parents</Text>
          </View>
        </LinearGradient>

        <View style={styles.statusRow}>
          <StatusCard label="WhatsApp" value="Phase 2" icon="whatsapp" color={colors.success} />
          <StatusCard label="SMS fallback" value="Later" icon="message-processing-outline" color={colors.info} />
        </View>

        <PremiumCard style={styles.integrationCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Integration status</Text>
              <Text style={styles.cardSubtitle}>Designed for ReachWA first, then SMS fallback if parents are offline.</Text>
            </View>
            <View style={styles.phasePill}>
              <Text style={styles.phasePillText}>Phase 2</Text>
            </View>
          </View>
          <IntegrationStep title="Connect ReachWA account" state="Planned" icon="link-variant" />
          <View style={styles.divider} />
          <IntegrationStep title="Verify teacher sender profile" state="Required" icon="shield-account-outline" />
          <View style={styles.divider} />
          <IntegrationStep title="Enable SMS fallback" state="Later" icon="cellphone-message" />
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Message templates</Text>
          <Text style={styles.sectionAction}>Edit all</Text>
        </View>

        <View style={styles.templateList}>
          <TemplateCard title="Fee reminder" subtitle="Polite pending-fee reminder with class and month" icon="cash-clock" color={colors.danger} sample="Dear parent, June class fee is still pending for Kavindu. Thank you." />
          <TemplateCard title="Absence alert" subtitle="Send when a student is absent from a session" icon="account-alert-outline" color={colors.warning} sample="Your child was absent today. Please contact the teacher if needed." />
          <TemplateCard title="Class announcement" subtitle="Schedule change, holiday or extra class message" icon="bullhorn-outline" color={colors.primary} sample="Tomorrow's class will start at 10:30 AM in Hall A." />
          <TemplateCard title="Receipt message" subtitle="Share receipt number and amount after payment" icon="receipt-text-check-outline" color={colors.success} sample="Payment received. Receipt RCPT-0004 has been generated." />
        </View>

        <PremiumCard style={styles.consentCard}>
          <View style={styles.consentIcon}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.consentCopy}>
            <Text style={styles.cardTitle}>Consent safety gate</Text>
            <Text style={styles.cardSubtitle}>Only parents with captured communication consent should receive automated messages in production.</Text>
          </View>
          <View style={styles.consentBadge}>
            <Text style={styles.consentBadgeText}>{consentReadyPercent}%</Text>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.rulesCard}>
          <Text style={styles.cardTitle}>Send rules</Text>
          <Text style={styles.cardSubtitle}>Teacher-friendly defaults for respectful parent communication.</Text>
          <RuleRow icon="clock-outline" label="Quiet hours" value="After 8:00 PM blocked" />
          <View style={styles.divider} />
          <RuleRow icon="account-check-outline" label="Consent required" value="Enabled" />
          <View style={styles.divider} />
          <RuleRow icon="message-reply-text-outline" label="Reply handling" value="Teacher phone first" />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusCard({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.statusCard}>
      <View style={[styles.statusIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={23} color={color} />
      </View>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
    </PremiumCard>
  );
}

function IntegrationStep({ title, state, icon }: { title: string; state: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.integrationRow}>
      <View style={styles.integrationIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.integrationTitle}>{title}</Text>
      <Text style={styles.integrationState}>{state}</Text>
    </View>
  );
}

function TemplateCard({ title, subtitle, icon, color, sample }: { title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; sample: string }) {
  return (
    <PremiumCard style={styles.templateCard}>
      <View style={styles.templateTopRow}>
        <View style={[styles.templateIcon, { backgroundColor: `${color}1F` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <View style={styles.templateCopy}>
          <Text style={styles.templateTitle}>{title}</Text>
          <Text style={styles.templateSubtitle}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
      </View>
      <View style={styles.sampleBox}>
        <Text style={styles.sampleText}>{sample}</Text>
      </View>
    </PremiumCard>
  );
}

function RuleRow({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.ruleCopy}>
        <Text style={styles.ruleLabel}>{label}</Text>
        <Text style={styles.ruleValue}>{value}</Text>
      </View>
    </View>
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
  statusRow: { flexDirection: 'row', gap: spacing.md },
  statusCard: { flex: 1, padding: spacing.lg, gap: spacing.xs },
  statusIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statusLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  statusValue: { fontSize: 21, fontWeight: '900' },
  integrationCard: { gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  phasePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.successSoft },
  phasePillText: { color: colors.success, fontSize: 11, fontWeight: '900' },
  integrationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  integrationIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  integrationTitle: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  integrationState: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  templateList: { gap: spacing.md },
  templateCard: { gap: spacing.md },
  templateTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  templateIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  templateCopy: { flex: 1 },
  templateTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  templateSubtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  sampleBox: { borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  sampleText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  consentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primarySoft },
  consentIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  consentCopy: { flex: 1 },
  consentBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.primarySoft },
  consentBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  rulesCard: { gap: spacing.sm },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  ruleIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  ruleCopy: { flex: 1 },
  ruleLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  ruleValue: { marginTop: 3, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
});
