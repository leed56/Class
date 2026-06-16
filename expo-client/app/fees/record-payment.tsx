import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { FeeInvoiceCard } from '@/features/fees/components/FeeInvoiceCard';
import { getInvoiceById, listOutstandingInvoices, recordPayment } from '@/features/fees/feeService';
import { FeeInvoice } from '@/features/fees/models';
import { FormTextField } from '@/features/students/components/FormTextField';
import { PaymentMethod } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function RecordPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ invoiceId?: string }>();
  const [invoice, setInvoice] = useState<FeeInvoice | null>(null);
  const [pickerInvoices, setPickerInvoices] = useState<FeeInvoice[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (params.invoiceId) {
        const nextInvoice = await getInvoiceById(params.invoiceId);
        if (!nextInvoice) {
          setError('Invoice not found.');
          setInvoice(null);
          return;
        }
        setInvoice(nextInvoice);
        setAmount(String(nextInvoice.outstandingAmount));
      } else {
        const outstanding = await listOutstandingInvoices();
        setPickerInvoices(outstanding);
        setInvoice(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load invoice.');
    } finally {
      setIsLoading(false);
    }
  }, [params.invoiceId]);

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  async function handleRecord() {
    if (!invoice) return;

    setIsSaving(true);
    setError(null);
    try {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount: Number(amount),
        method,
        note,
      });
      setReceiptNo(result.payment.receiptNo);
      router.replace(`/fees/receipt/${result.payment.receiptNo}` as Href);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not record payment.');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmRecord() {
    if (!invoice) return;
    Alert.alert(
      'Record payment?',
      `Save ${formatLkr(Number(amount) || 0)} for ${invoice.studentName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Record', onPress: handleRecord },
      ],
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!params.invoiceId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Link href="/(tabs)/fees" asChild>
              <Pressable style={styles.iconButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
              </Pressable>
            </Link>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Record Payment</Text>
              <Text style={styles.subtitle}>Choose an outstanding invoice to collect cash or bank payment.</Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {pickerInvoices.length === 0 ? (
            <PremiumCard>
              <EmptyState
                icon="cash-check"
                title="No outstanding invoices"
                message="All enrolled students are paid up for this month."
                actionLabel="Back to Fees"
                actionHref="/(tabs)/fees"
              />
            </PremiumCard>
          ) : (
            <View style={styles.list}>
              {pickerInvoices.map((item) => (
                <NavPressable key={item.id} href={`/fees/record-payment?invoiceId=${item.id}` as Href}>
                  <FeeInvoiceCard invoice={item} />
                </NavPressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error && !invoice) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Link href="/(tabs)/fees" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to fees</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) return null;

  const paymentAmount = Number(amount) || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/fees" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Record Payment</Text>
            <Text style={styles.subtitle}>Cash-first tuition collection with instant receipt preview.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="cash-register" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Selected invoice</Text>
            <Text style={styles.heroTitle}>{invoice.studentName}</Text>
            <Text style={styles.heroNote}>{invoice.className} • {invoice.month}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={styles.cardTitle}>Invoice summary</Text>
              <Text style={styles.cardSubtitle}>Outstanding balance before payment</Text>
            </View>
            <View style={styles.monthPill}>
              <Text style={styles.monthText}>{invoice.month}</Text>
            </View>
          </View>
          <View style={styles.figureRow}>
            <Figure label="Monthly fee" value={formatLkr(invoice.monthlyFee)} />
            <Figure label="Paid" value={formatLkr(invoice.paidAmount)} />
            <Figure label="Due" value={formatLkr(invoice.outstandingAmount)} danger />
          </View>
        </PremiumCard>

        <PremiumCard style={styles.formCard}>
          <Text style={styles.cardTitle}>Payment details</Text>
          <FormTextField
            label="Amount received"
            placeholder={`${invoice.outstandingAmount}`}
            icon="cash"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.methodBlock}>
            <Text style={styles.inputLabel}>Payment method</Text>
            <View style={styles.methodRow}>
              <MethodChip label="Cash" icon="cash" active={method === 'cash'} onPress={() => setMethod('cash')} />
              <MethodChip label="Bank" icon="bank-outline" active={method === 'bank'} onPress={() => setMethod('bank')} />
              <MethodChip label="Online" icon="credit-card-outline" active={method === 'online'} onPress={() => setMethod('online')} />
            </View>
          </View>
          <FormTextField label="Note" placeholder="Optional payment note" icon="note-text-outline" value={note} onChangeText={setNote} />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PremiumCard style={styles.receiptCard}>
          <View style={styles.receiptTopRow}>
            <View>
              <Text style={styles.cardTitle}>Receipt preview</Text>
              <Text style={styles.cardSubtitle}>Ready to share after saving</Text>
            </View>
            {receiptNo ? (
              <View style={styles.receiptNoPill}>
                <Text style={styles.receiptNoText}>{receiptNo}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.receiptPaper}>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Student</Text>
              <Text style={styles.receiptValue}>{invoice.studentName}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Class</Text>
              <Text style={styles.receiptValue}>{invoice.className}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Amount</Text>
              <Text style={styles.receiptAmount}>{formatLkr(paymentAmount)}</Text>
            </View>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.whatsappCard}>
          <View style={styles.whatsappIcon}>
            <MaterialCommunityIcons name="whatsapp" size={24} color={colors.success} />
          </View>
          <View style={styles.whatsappCopy}>
            <Text style={styles.cardTitle}>Send receipt to parent</Text>
            <Text style={styles.cardSubtitle}>Share receipt to {invoice.parentPhone} through WhatsApp after recording.</Text>
          </View>
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>Payment total</Text>
          <Text style={styles.saveValue}>{formatLkr(paymentAmount)}</Text>
        </View>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={confirmRecord} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="receipt-text-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>Record</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Figure({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.figureBox}>
      <Text style={styles.figureLabel}>{label}</Text>
      <Text style={[styles.figureValue, { color: danger ? colors.danger : colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function MethodChip({
  label,
  icon,
  active = false,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.methodChip, active && styles.methodChipActive]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={17} color={active ? 'white' : colors.textSecondary} />
      <Text style={[styles.methodText, active && styles.methodTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
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
  invoiceCard: { gap: spacing.lg },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  monthPill: { borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 7 },
  monthText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  figureRow: { flexDirection: 'row', gap: spacing.sm },
  figureBox: { flex: 1, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  figureLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  figureValue: { marginTop: 4, fontSize: 13, fontWeight: '900' },
  formCard: { gap: spacing.lg },
  methodBlock: { gap: spacing.sm },
  inputLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  methodRow: { flexDirection: 'row', gap: spacing.sm },
  methodChip: { flex: 1, minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  methodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  methodTextActive: { color: 'white' },
  receiptCard: { gap: spacing.lg },
  receiptTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  receiptNoPill: { borderRadius: 999, backgroundColor: colors.successSoft, paddingHorizontal: 10, paddingVertical: 7 },
  receiptNoText: { color: colors.success, fontSize: 11, fontWeight: '900' },
  receiptPaper: { gap: spacing.md, borderRadius: radius.xl, padding: spacing.lg, backgroundColor: colors.background },
  receiptLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  receiptLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  receiptValue: { flex: 1, textAlign: 'right', color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  receiptAmount: { color: colors.success, fontSize: 15, fontWeight: '900' },
  whatsappCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.successSoft },
  whatsappIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  whatsappCopy: { flex: 1 },
  list: { gap: spacing.md },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
