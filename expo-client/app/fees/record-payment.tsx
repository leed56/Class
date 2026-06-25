import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { FeeInvoiceCard } from '@/features/fees/components/FeeInvoiceCard';
import { getInvoiceById, listOutstandingInvoices, listStudentOpenInvoices, recordPayment, recordSplitPayment } from '@/features/fees/feeService';
import { FeeInvoice } from '@/features/fees/models';
import { FormTextField } from '@/features/students/components/FormTextField';
import { PaymentMethod } from '@/lib/database.types';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function invoiceLineLabel(invoice: FeeInvoice, t: (key: string) => string) {
  if (invoice.invoiceType === 'admission') return t('studentProfile.admissionFee');
  if (invoice.invoiceType === 'material') return t('studentProfile.materialFee');
  if (invoice.invoiceType === 'exam') return t('studentProfile.examFee');
  return interpolate(t('studentProfile.classMonth'), { className: invoice.className, month: invoice.month });
}

function computeSplitTotals(selectedLines: Record<string, { included: boolean; amount: string }>) {
  const active = Object.values(selectedLines).filter((line) => line.included && Number(line.amount) > 0);
  const total = active.reduce((sum, line) => sum + Number(line.amount), 0);
  return { total, count: active.length };
}

export default function RecordPaymentScreen() {
  return (
    <PermissionGate permission="record_payments">
      <RecordPaymentContent />
    </PermissionGate>
  );
}

function RecordPaymentContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ invoiceId?: string; studentId?: string }>();
  const [invoice, setInvoice] = useState<FeeInvoice | null>(null);
  const [pickerInvoices, setPickerInvoices] = useState<FeeInvoice[]>([]);
  const [splitInvoices, setSplitInvoices] = useState<FeeInvoice[]>([]);
  const [splitStudentName, setSplitStudentName] = useState('');
  const [selectedLines, setSelectedLines] = useState<Record<string, { included: boolean; amount: string }>>({});
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
      if (params.studentId) {
        const open = await listStudentOpenInvoices(params.studentId);
        setSplitInvoices(open);
        setSplitStudentName(open[0]?.studentName ?? t('recordPayment.studentFallback'));
        const initial: Record<string, { included: boolean; amount: string }> = {};
        for (const item of open) {
          const preselect = params.invoiceId ? item.id === params.invoiceId : true;
          initial[item.id] = { included: preselect, amount: String(item.outstandingAmount) };
        }
        setSelectedLines(initial);
        setInvoice(null);
        return;
      }

      if (params.invoiceId) {
        const nextInvoice = await getInvoiceById(params.invoiceId);
        if (!nextInvoice) {
          setError(t('recordPayment.invoiceNotFound'));
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
      setError(resolveServiceErrorMessage(loadError, t, 'recordPayment.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.invoiceId, params.studentId, t]);

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  async function handleSplitRecord() {
    if (!params.studentId) return;

    const lines = Object.entries(selectedLines)
      .filter(([, value]) => value.included)
      .map(([invoiceId, value]) => ({
        invoiceId,
        amount: Number(value.amount),
      }))
      .filter((line) => line.amount > 0);

    if (lines.length === 0) {
      setError(t('recordPayment.selectOneInvoice'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await recordSplitPayment({
        studentId: params.studentId,
        lines,
        method,
        note,
      });
      router.replace(`/fees/receipt/${result.receiptNo}` as Href);
    } catch (saveError) {
      setError(resolveServiceErrorMessage(saveError, t, 'recordPayment.recordFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmSplitRecord() {
    const { total, count } = computeSplitTotals(selectedLines);
    Alert.alert(
      t('recordPayment.splitConfirmTitle'),
      interpolate(count === 1 ? t('recordPayment.splitConfirmMessage') : t('recordPayment.splitConfirmMessageMulti'), {
        total: formatLkr(total),
        count,
        name: splitStudentName,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('recordPayment.record'), onPress: handleSplitRecord },
      ],
    );
  }

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
      setError(resolveServiceErrorMessage(saveError, t, 'recordPayment.recordFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmRecord() {
    if (!invoice) return;
    Alert.alert(
      t('recordPayment.recordConfirmTitle'),
      interpolate(t('recordPayment.recordConfirmMessage'), {
        amount: formatLkr(Number(amount) || 0),
        name: invoice.studentName,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('recordPayment.record'), onPress: handleRecord },
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

  if (params.studentId) {
    const { total: splitTotal, count: splitLineCount } = computeSplitTotals(selectedLines);
    const backHref = params.invoiceId
      ? (`/fees/record-payment?invoiceId=${params.invoiceId}` as Href)
      : (`/students/${params.studentId}` as Href);

    if (splitInvoices.length === 0) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Link href={backHref} asChild>
                <Pressable style={styles.iconButton}>
                  <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
                </Pressable>
              </Link>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{t('recordPayment.splitTitle')}</Text>
                <Text style={styles.subtitle}>{interpolate(t('recordPayment.splitSubtitleEmpty'), { name: splitStudentName })}</Text>
              </View>
            </View>
            <PremiumCard>
              <EmptyState
                icon="cash-check"
                title={t('recordPayment.allPaidUp')}
                message={t('recordPayment.allPaidUpMessage')}
                actionLabel={t('recordPayment.backToStudent')}
                actionHref={backHref}
              />
            </PremiumCard>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Link href={backHref} asChild>
              <Pressable style={styles.iconButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
              </Pressable>
            </Link>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t('recordPayment.splitTitle')}</Text>
              <Text style={styles.subtitle}>{t('recordPayment.splitSubtitle')}</Text>
            </View>
          </View>

          <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={30} color="white" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>{t('recordPayment.heroStudent')}</Text>
              <Text style={styles.heroTitle}>{splitStudentName}</Text>
              <Text style={styles.heroNote}>
                {splitInvoices.length === 1
                  ? t('recordPayment.openInvoicesSingle')
                  : interpolate(t('recordPayment.openInvoicesMulti'), { count: splitInvoices.length })}
              </Text>
            </View>
          </LinearGradient>

          <PremiumCard style={styles.formCard}>
            <Text style={styles.cardTitle}>{t('recordPayment.selectInvoices')}</Text>
            <Text style={styles.cardSubtitle}>{t('recordPayment.selectInvoicesHint')}</Text>
            <View style={styles.splitList}>
              {splitInvoices.map((item) => {
                const line = selectedLines[item.id] ?? { included: false, amount: '0' };
                return (
                  <View key={item.id} style={[styles.splitLine, line.included && styles.splitLineActive]}>
                    <Pressable
                      style={[styles.splitCheckbox, line.included && styles.splitCheckboxActive]}
                      onPress={() =>
                        setSelectedLines((prev) => ({
                          ...prev,
                          [item.id]: { ...line, included: !line.included },
                        }))
                      }
                    >
                      {line.included ? <MaterialCommunityIcons name="check" size={14} color="white" /> : null}
                    </Pressable>
                    <View style={styles.splitLineCopy}>
                      <Text style={styles.splitLineTitle}>{invoiceLineLabel(item, t)}</Text>
                      <Text style={styles.splitLineMeta}>{interpolate(t('recordPayment.dueMeta'), { amount: formatLkr(item.outstandingAmount) })}</Text>
                    </View>
                    <TextInput
                      placeholder={`${item.outstandingAmount}`}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      value={line.amount}
                      onChangeText={(text) =>
                        setSelectedLines((prev) => ({
                          ...prev,
                          [item.id]: { ...line, amount: text, included: true },
                        }))
                      }
                      style={styles.splitAmountInput}
                    />
                  </View>
                );
              })}
            </View>
          </PremiumCard>

          <PremiumCard style={styles.formCard}>
            <Text style={styles.cardTitle}>{t('recordPayment.paymentDetails')}</Text>
            <View style={styles.methodBlock}>
              <Text style={styles.inputLabel}>{t('recordPayment.paymentMethod')}</Text>
              <View style={styles.methodRow}>
                <MethodChip label={t('recordPayment.methodCash')} icon="cash" active={method === 'cash'} onPress={() => setMethod('cash')} />
                <MethodChip label={t('recordPayment.methodBank')} icon="bank-outline" active={method === 'bank'} onPress={() => setMethod('bank')} />
                <MethodChip label={t('recordPayment.methodOnline')} icon="credit-card-outline" active={method === 'online'} onPress={() => setMethod('online')} />
              </View>
            </View>
            <FormTextField label={t('recordPayment.noteLabel')} placeholder={t('recordPayment.notePlaceholder')} icon="note-text-outline" value={note} onChangeText={setNote} />
          </PremiumCard>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.saveBar}>
          <View>
            <Text style={styles.saveLabel}>{t('recordPayment.splitTotal')}</Text>
            <Text style={styles.saveValue}>{formatLkr(splitTotal)}</Text>
            <Text style={styles.saveMeta}>
              {splitLineCount === 1
                ? t('recordPayment.linesSelectedSingle')
                : interpolate(t('recordPayment.linesSelectedMulti'), { count: splitLineCount })}
            </Text>
          </View>
          <Pressable
            style={[styles.saveButton, (isSaving || splitLineCount === 0) && styles.saveButtonDisabled]}
            onPress={confirmSplitRecord}
            disabled={isSaving || splitLineCount === 0}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="receipt-text-check" size={18} color="white" />
                <Text style={styles.saveButtonText}>{t('recordPayment.recordSplit')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!params.invoiceId && !params.studentId) {
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
              <Text style={styles.title}>{t('recordPayment.title')}</Text>
              <Text style={styles.subtitle}>{t('recordPayment.subtitlePicker')}</Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {pickerInvoices.length === 0 ? (
            <PremiumCard>
              <EmptyState
                icon="cash-check"
                title={t('recordPayment.noOutstanding')}
                message={t('recordPayment.noOutstandingMessage')}
                actionLabel={t('recordPayment.backToFees')}
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
              <Text style={styles.retryText}>{t('recordPayment.backToFees')}</Text>
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
            <Text style={styles.title}>{t('recordPayment.title')}</Text>
            <Text style={styles.subtitle}>{t('recordPayment.subtitleSingle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="cash-register" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('recordPayment.selectedInvoice')}</Text>
            <Text style={styles.heroTitle}>{invoice.studentName}</Text>
            <Text style={styles.heroNote}>{invoice.className} • {invoice.month}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={styles.cardTitle}>{t('recordPayment.invoiceSummary')}</Text>
              <Text style={styles.cardSubtitle}>{t('recordPayment.outstandingBefore')}</Text>
            </View>
            <View style={styles.monthPill}>
              <Text style={styles.monthText}>{invoice.month}</Text>
            </View>
          </View>
          <View style={styles.figureRow}>
            <Figure label={t('recordPayment.monthlyFee')} value={formatLkr(invoice.monthlyFee)} />
            <Figure label={t('recordPayment.paid')} value={formatLkr(invoice.paidAmount)} />
            <Figure label={t('recordPayment.due')} value={formatLkr(invoice.outstandingAmount)} danger />
          </View>
        </PremiumCard>

        <PremiumCard style={styles.formCard}>
          <Text style={styles.cardTitle}>{t('recordPayment.paymentDetails')}</Text>
          <FormTextField
            label={t('recordPayment.amountReceived')}
            placeholder={`${invoice.outstandingAmount}`}
            icon="cash"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.methodBlock}>
            <Text style={styles.inputLabel}>{t('recordPayment.paymentMethod')}</Text>
            <View style={styles.methodRow}>
              <MethodChip label={t('recordPayment.methodCash')} icon="cash" active={method === 'cash'} onPress={() => setMethod('cash')} />
              <MethodChip label={t('recordPayment.methodBank')} icon="bank-outline" active={method === 'bank'} onPress={() => setMethod('bank')} />
              <MethodChip label={t('recordPayment.methodOnline')} icon="credit-card-outline" active={method === 'online'} onPress={() => setMethod('online')} />
            </View>
          </View>
          <FormTextField label={t('recordPayment.noteLabel')} placeholder={t('recordPayment.notePlaceholder')} icon="note-text-outline" value={note} onChangeText={setNote} />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PremiumCard style={styles.receiptCard}>
          <View style={styles.receiptTopRow}>
            <View>
              <Text style={styles.cardTitle}>{t('recordPayment.receiptPreview')}</Text>
              <Text style={styles.cardSubtitle}>{t('recordPayment.receiptReady')}</Text>
            </View>
            {receiptNo ? (
              <View style={styles.receiptNoPill}>
                <Text style={styles.receiptNoText}>{receiptNo}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.receiptPaper}>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>{t('recordPayment.receiptStudent')}</Text>
              <Text style={styles.receiptValue}>{invoice.studentName}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>{t('recordPayment.receiptClass')}</Text>
              <Text style={styles.receiptValue}>{invoice.className}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>{t('recordPayment.receiptAmount')}</Text>
              <Text style={styles.receiptAmount}>{formatLkr(paymentAmount)}</Text>
            </View>
          </View>
        </PremiumCard>

        <PremiumCard style={styles.whatsappCard}>
          <View style={styles.whatsappIcon}>
            <MaterialCommunityIcons name="whatsapp" size={24} color={colors.success} />
          </View>
          <View style={styles.whatsappCopy}>
            <Text style={styles.cardTitle}>{t('recordPayment.sendReceiptTitle')}</Text>
            <Text style={styles.cardSubtitle}>{interpolate(t('recordPayment.sendReceiptSubtitle'), { phone: invoice.parentPhone })}</Text>
          </View>
        </PremiumCard>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('recordPayment.paymentTotal')}</Text>
          <Text style={styles.saveValue}>{formatLkr(paymentAmount)}</Text>
        </View>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={confirmRecord} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="receipt-text-check" size={18} color="white" />
              <Text style={styles.saveButtonText}>{t('recordPayment.record')}</Text>
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
  saveMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  splitList: { gap: spacing.sm },
  splitLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm },
  splitLineActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  splitCheckbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  splitCheckboxActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  splitLineCopy: { flex: 1, minWidth: 0 },
  splitLineTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  splitLineMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  splitAmountInput: { width: 88, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
