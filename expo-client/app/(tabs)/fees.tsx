import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { FeeInvoiceCard } from '@/features/fees/components/FeeInvoiceCard';
import { PaymentRow } from '@/features/fees/components/PaymentRow';
import { FeeSummary, getFeeSummaryForMonth, listOutstandingInvoices, listRecentPayments } from '@/features/fees/feeService';
import { exportDefaulterCsv } from '@/features/fees/feeExport';
import { FeeInvoice, PaymentRecord } from '@/features/fees/models';
import { buildFeeReminderMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function FeesScreen() {
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextSummary, nextInvoices, nextPayments, workspace] = await Promise.all([
        getFeeSummaryForMonth(),
        listOutstandingInvoices(),
        listRecentPayments(),
        getCurrentWorkspace(),
      ]);
      setSummary(nextSummary);
      setInvoices(nextInvoices);
      setPayments(nextPayments);
      setWorkspaceName(workspace?.name ?? 'Your workspace');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load fees.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendFeeReminder = useCallback(
    async (invoice: FeeInvoice) => {
      const message = buildFeeReminderMessage({
        workspaceName,
        studentName: invoice.studentName,
        className: invoice.className,
        month: invoice.month,
        outstandingAmount: invoice.outstandingAmount,
      });
      await openWhatsAppChat(invoice.parentPhone, message);
    },
    [workspaceName],
  );

  const sendTopReminder = useCallback(async () => {
    const target = [...invoices].sort((a, b) => b.outstandingAmount - a.outstandingAmount)[0];
    if (!target) return;
    await sendFeeReminder(target);
  }, [invoices, sendFeeReminder]);

  useFocusEffect(
    useCallback(() => {
      loadFees();
    }, [loadFees]),
  );

  const monthLabel = summary?.monthLabel ?? 'This month';
  const collected = summary?.collected ?? 0;
  const outstanding = summary?.outstanding ?? 0;
  const collectionPercent = summary?.collectionPercent ?? 0;
  const defaulterCount = summary?.defaulterCount ?? 0;

  const handleExportDefaulters = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportDefaulterCsv(monthLabel, workspaceName, invoices);
    } catch (exportError) {
      Alert.alert(
        'Export failed',
        exportError instanceof Error ? exportError.message : 'Could not export the defaulter list.',
      );
    } finally {
      setIsExporting(false);
    }
  }, [invoices, monthLabel, workspaceName]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Fees</Text>
            <Text style={styles.subtitle}>Track monthly tuition fees, cash payments, receipts and defaulters.</Text>
          </View>
          <NavPressable href="/fees/record-payment" style={styles.addButton}>
            <MaterialCommunityIcons name="cash-plus" size={23} color="white" />
          </NavPressable>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>{monthLabel} collection</Text>
              <Text style={styles.heroValue}>{collectionPercent}% collected</Text>
            </View>
            <View style={styles.monthPill}>
              <MaterialCommunityIcons name="calendar-month" size={15} color="white" />
              <Text style={styles.monthText}>{monthLabel.split(' ')[0]}</Text>
            </View>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${collectionPercent}%` }]} />
          </View>
          <View style={styles.heroStatsRow}>
            <View>
              <Text style={styles.heroStatLabel}>Collected</Text>
              <Text style={styles.heroStatValue}>{formatLkr(collected)}</Text>
            </View>
            <View>
              <Text style={styles.heroStatLabel}>Outstanding</Text>
              <Text style={styles.heroStatValue}>{formatLkr(outstanding)}</Text>
            </View>
          </View>
        </LinearGradient>

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading fee records...</Text>
          </PremiumCard>
        ) : error ? (
          <PremiumCard style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadFees}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </PremiumCard>
        ) : (
          <>
            <View style={styles.metricsRow}>
              <MetricCard label="Outstanding" value={formatLkr(outstanding)} icon="account-alert" tone={colors.danger} />
              <MetricCard label="Defaulters" value={`${defaulterCount}`} icon="account-alert" tone={colors.warning} />
            </View>

            <View style={styles.actionColumn}>
              <NavPressable href="/fees/record-payment" style={styles.primaryAction}>
                <MaterialCommunityIcons name="cash-register" size={19} color="white" />
                <Text style={styles.primaryActionText}>Record Payment</Text>
              </NavPressable>
              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryAction} onPress={sendTopReminder} disabled={defaulterCount === 0}>
                  <MaterialCommunityIcons name="whatsapp" size={19} color={colors.success} />
                  <Text style={styles.secondaryActionText}>Remind</Text>
                </Pressable>
                <Pressable
                  style={styles.exportAction}
                  onPress={handleExportDefaulters}
                  disabled={invoices.length === 0 || isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="file-delimited-outline" size={19} color={colors.primary} />
                      <Text style={styles.exportActionText}>Export CSV</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {defaulterCount > 0 ? (
              <Pressable onPress={handleExportDefaulters} disabled={isExporting}>
                <PremiumCard style={styles.alertCard}>
                  <View style={styles.alertIcon}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.danger} />
                  </View>
                  <View style={styles.alertTextBlock}>
                    <Text style={styles.alertTitle}>Defaulter follow-up</Text>
                    <Text style={styles.alertCopy}>
                      {defaulterCount} open invoices • export CSV or send WhatsApp reminders.
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
                </PremiumCard>
              </Pressable>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Outstanding fees</Text>
              <Text style={styles.sectionAction}>{invoices.length} open</Text>
            </View>

            {invoices.length === 0 ? (
              <PremiumCard>
                <EmptyState
                  icon="cash-check"
                  title="All caught up"
                  message="Every enrolled student invoice for this month is fully paid."
                  actionLabel="Record Payment"
                  actionHref="/fees/record-payment"
                />
              </PremiumCard>
            ) : (
              <View style={styles.list}>
                {invoices.map((invoice) => (
                  <NavPressable key={invoice.id} href={`/fees/record-payment?invoiceId=${invoice.id}` as Href}>
                    <FeeInvoiceCard invoice={invoice} onRemind={() => sendFeeReminder(invoice)} />
                  </NavPressable>
                ))}
              </View>
            )}

            <PremiumCard>
              <View style={styles.sectionHeaderInsideCard}>
                <Text style={styles.cardTitle}>Recent payments</Text>
                <Text style={styles.sectionAction}>Receipts</Text>
              </View>
              {payments.length === 0 ? (
                <Text style={styles.emptyPayments}>Payments you record will appear here with receipt numbers.</Text>
              ) : (
                <View style={styles.paymentsList}>
                  {payments.map((payment) => (
                    <NavPressable key={payment.id} href={`/fees/receipt/${payment.receiptNo}` as Href}>
                      <PaymentRow payment={payment} />
                    </NavPressable>
                  ))}
                </View>
              )}
            </PremiumCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { maxWidth: 280, marginTop: 4, color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  addButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroValue: { marginTop: 4, color: 'white', fontSize: 29, fontWeight: '900', letterSpacing: -0.9 },
  monthPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.15)' },
  monthText: { color: 'white', fontSize: 11, fontWeight: '900' },
  heroProgressTrack: { marginTop: spacing.xl, height: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.success },
  heroStatsRow: { marginTop: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  heroStatLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroStatValue: { marginTop: 4, color: 'white', fontSize: 16, fontWeight: '900' },
  stateCard: { alignItems: 'center', gap: spacing.md },
  stateText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', gap: spacing.md },
  actionColumn: { gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  primaryAction: { minHeight: 52, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryActionText: { color: 'white', fontSize: 13, fontWeight: '900' },
  secondaryAction: { flex: 1, minHeight: 52, borderRadius: radius.lg, backgroundColor: colors.successSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  secondaryActionText: { color: colors.success, fontSize: 13, fontWeight: '900' },
  exportAction: { flex: 1, minHeight: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  exportActionText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.dangerSoft },
  alertIcon: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  alertTextBlock: { flex: 1 },
  alertTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  alertCopy: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderInsideCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  list: { gap: spacing.md },
  paymentsList: { gap: 2 },
  emptyPayments: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});

