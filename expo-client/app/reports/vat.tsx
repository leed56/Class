import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getVatSummary, VatSummary } from '@/features/vat/localVatStore';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function VatReportScreen() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<VatSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadVatSummary() {
      try {
        const nextSummary = await getVatSummary();
        if (isMounted) setSummary(nextSummary);
      } catch (vatError) {
        if (isMounted) setError(vatError instanceof Error ? vatError.message : t('vatReport.loadFailed'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadVatSummary();

    return () => {
      isMounted = false;
    };
  }, [t]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/reports" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('vatReport.title')}</Text>
            <Text style={styles.subtitle}>{t('vatReport.subtitle')}</Text>
          </View>
          <View style={styles.iconButtonDisabled}>
            <MaterialCommunityIcons name="cloud-lock-outline" size={22} color={colors.textSecondary} />
          </View>
        </View>

        {isLoading ? (
          <PremiumCard style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingTitle}>{t('vatReport.loadingTitle')}</Text>
            <Text style={styles.loadingText}>{t('vatReport.loadingText')}</Text>
          </PremiumCard>
        ) : null}

        {error ? (
          <PremiumCard style={styles.errorCard}>
            <MaterialCommunityIcons name="database-alert-outline" size={28} color={colors.danger} />
            <Text style={styles.errorTitle}>{t('vatReport.errorTitle')}</Text>
            <Text style={styles.errorText}>{error}</Text>
          </PremiumCard>
        ) : null}

        {summary ? <VatDashboard summary={summary} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function VatDashboard({ summary }: { summary: VatSummary }) {
  const { t } = useI18n();
  const isPayable = summary.netPayable > 0;

  return (
    <>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="receipt-text-check-outline" size={29} color="white" />
          </View>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={summary.status === 'ready' ? 'shield-check-outline' : 'shield-alert-outline'} size={15} color="white" />
            <Text style={styles.statusPillText}>{summary.statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.heroLabel}>{summary.quarterLabel} • {formatDateRange(summary.quarterStart, summary.quarterEnd)}</Text>
        <Text style={styles.heroTitle}>{formatLkr(summary.netPayable)}</Text>
        <Text style={styles.heroNote}>{isPayable ? t('vatReport.heroPayableNote') : t('vatReport.heroBalancedNote')}</Text>
      </LinearGradient>

      <View style={styles.summaryGrid}>
        <MetricCard label={t('vatReport.outputVat')} value={formatLkr(summary.outputVat)} note={interpolate(t('vatReport.taxableRevenue'), { amount: formatLkr(summary.taxableRevenue) })} icon="arrow-up-bold-circle-outline" color={colors.danger} />
        <MetricCard label={t('vatReport.inputVat')} value={formatLkr(summary.inputVat)} note={interpolate(t('vatReport.confirmedBills'), { count: summary.confirmedSupplierBills })} icon="arrow-down-bold-circle-outline" color={colors.success} />
      </View>

      <PremiumCard style={styles.netCard}>
        <View style={styles.netHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>{t('vatReport.netPayable')}</Text>
            <Text style={styles.cardSubtitle}>{t('vatReport.netSubtitle')}</Text>
          </View>
          <View style={[styles.netBadge, { backgroundColor: isPayable ? colors.warningSoft : colors.successSoft }]}>
            <Text style={[styles.netBadgeText, { color: isPayable ? colors.warning : colors.success }]}>{isPayable ? t('vatReport.payable') : t('vatReport.balanced')}</Text>
          </View>
        </View>
        <Text style={styles.netValue}>{formatLkr(summary.netPayable)}</Text>
        <View style={styles.formulaBar}>
          <Text style={styles.formulaText}>{formatLkr(summary.outputVat)}</Text>
          <MaterialCommunityIcons name="minus" size={18} color={colors.textSecondary} />
          <Text style={styles.formulaText}>{formatLkr(summary.inputVat)}</Text>
          <MaterialCommunityIcons name="equal" size={18} color={colors.textSecondary} />
          <Text style={styles.formulaStrong}>{formatLkr(summary.netPayable)}</Text>
        </View>
      </PremiumCard>

      <PremiumCard style={styles.confidenceCard}>
        <View style={styles.confidenceHeader}>
          <View style={styles.confidenceIcon}>
            <MaterialCommunityIcons name="shield-check-outline" size={23} color={colors.primary} />
          </View>
          <View style={styles.confidenceCopy}>
            <Text style={styles.cardTitle}>{t('vatReport.confidenceTitle')}</Text>
            <Text style={styles.cardSubtitle}>{summary.statusNote}</Text>
          </View>
          <Text style={styles.confidenceScore}>{summary.confidenceScore}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${summary.confidenceScore}%` }]} />
        </View>
        <View style={styles.statusRow}>
          <StatusChip label={interpolate(t('vatReport.confirmedChip'), { count: summary.confirmedSupplierBills })} icon="check-circle-outline" tone="success" />
          <StatusChip label={interpolate(t('vatReport.pendingChip'), { count: summary.pendingSupplierBills })} icon="clock-alert-outline" tone={summary.pendingSupplierBills ? 'warning' : 'success'} />
        </View>
      </PremiumCard>

      <PremiumCard style={styles.supplierCard}>
        <View style={styles.netHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>{t('vatReport.supplierTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('vatReport.supplierSubtitle')}</Text>
          </View>
          <MaterialCommunityIcons name="file-document-check-outline" size={24} color={colors.success} />
        </View>
        <ValueRow label={t('vatReport.confirmedSpend')} value={formatLkr(summary.confirmedSupplierSpend)} />
        <View style={styles.divider} />
        <ValueRow label={t('vatReport.claimableInput')} value={formatLkr(summary.inputVat)} />
      </PremiumCard>

      <View style={styles.exportGrid}>
        <DisabledExportButton icon="file-pdf-box" label={t('vatReport.exportPdf')} lockedLabel={t('vatReport.locked')} />
        <DisabledExportButton icon="file-delimited-outline" label={t('vatReport.exportCsv')} lockedLabel={t('vatReport.locked')} />
      </View>

      <PremiumCard style={styles.disclaimerCard}>
        <MaterialCommunityIcons name="information-outline" size={21} color={colors.info} />
        <Text style={styles.disclaimerText}>{t('vatReport.disclaimer')}</Text>
      </PremiumCard>
    </>
  );
}

function MetricCard({ label, value, note, icon, color }: { label: string; value: string; note: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricNote}>{note}</Text>
    </PremiumCard>
  );
}

function StatusChip({ label, icon, tone }: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: 'success' | 'warning' }) {
  const color = tone === 'success' ? colors.success : colors.warning;
  const backgroundColor = tone === 'success' ? colors.successSoft : colors.warningSoft;

  return (
    <View style={[styles.statusChip, { backgroundColor }]}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={[styles.statusChipText, { color }]}>{label}</Text>
    </View>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  );
}

function DisabledExportButton({ icon, label, lockedLabel }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; lockedLabel: string }) {
  return (
    <View style={styles.disabledExportButton}>
      <MaterialCommunityIcons name={icon} size={21} color={colors.textSecondary} />
      <Text style={styles.disabledExportText}>{label}</Text>
      <Text style={styles.disabledExportSubtext}>{lockedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  iconButtonDisabled: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, opacity: 0.7 },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  loadingCard: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  loadingText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  errorCard: { alignItems: 'center', gap: spacing.sm, borderColor: colors.dangerSoft },
  errorTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  errorText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.lg },
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.16)' },
  statusPillText: { color: 'white', fontSize: 11, fontWeight: '900' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 5, color: 'white', fontSize: 35, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2 },
  heroNote: { marginTop: 8, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', gap: spacing.md },
  metricCard: { flex: 1, padding: spacing.lg, gap: spacing.xs },
  metricIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  metricLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  metricValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  metricNote: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  netCard: { gap: spacing.lg },
  netHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  netBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  netBadgeText: { fontSize: 11, fontWeight: '900' },
  netValue: { color: colors.textPrimary, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  formulaBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  formulaText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  formulaStrong: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  confidenceCard: { gap: spacing.lg, borderColor: colors.primarySoft },
  confidenceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  confidenceIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  confidenceCopy: { flex: 1 },
  confidenceScore: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 9, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 9, borderRadius: 999, backgroundColor: colors.primary },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusChipText: { fontSize: 11, fontWeight: '900' },
  supplierCard: { gap: spacing.md },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  valueLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  valueText: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  exportGrid: { flexDirection: 'row', gap: spacing.md },
  disabledExportButton: { flex: 1, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, opacity: 0.62 },
  disabledExportText: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  disabledExportSubtext: { color: colors.textSecondary, fontSize: 10, fontWeight: '900' },
  disclaimerCard: { flexDirection: 'row', gap: spacing.sm, borderColor: colors.infoSoft, backgroundColor: colors.surface },
  disclaimerText: { flex: 1, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
});
