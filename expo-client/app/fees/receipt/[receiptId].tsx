import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { getPaymentByReceiptNo } from '@/features/fees/feeService';
import { PaymentRecord } from '@/features/fees/models';
import { buildReceiptMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function ReceiptDetailScreenContent() {
  const params = useLocalSearchParams<{ receiptId: string }>();
  const { t } = useI18n();
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReceipt = useCallback(async () => {
    if (!params.receiptId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextPayment, workspace] = await Promise.all([
        getPaymentByReceiptNo(params.receiptId),
        getCurrentWorkspace(),
      ]);
      setPayment(nextPayment);
      setWorkspaceName(workspace?.name ?? t('receiptDetail.workspaceFallback'));
      if (!nextPayment) setError(t('receiptDetail.notFound'));
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'receiptDetail.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.receiptId, t]);

  useFocusEffect(
    useCallback(() => {
      loadReceipt();
    }, [loadReceipt]),
  );

  async function shareReceipt() {
    if (!payment) return;

    const message = buildReceiptMessage({
      workspaceName,
      studentName: payment.studentName,
      className: payment.className,
      amount: payment.amount,
      receiptNo: payment.receiptNo,
      paidAt: payment.paidAt,
      method: payment.method,
      allocations: payment.allocations,
      t,
    });

    await openWhatsAppChat(payment.parentPhone, message, t);
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

  if (error || !payment) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? t('receiptDetail.notFound')}</Text>
          <Link href="/(tabs)/fees" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('receiptDetail.backToFees')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>{t('receiptDetail.title')}</Text>
            <Text style={styles.subtitle}>{t('receiptDetail.subtitle')}</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textPrimary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="receipt-text-check" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('receiptDetail.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{payment.receiptNo}</Text>
            <Text style={styles.heroNote}>{payment.paidAt} • {payment.method.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.receiptPaperCard}>
          <View style={styles.receiptHeader}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="school" size={26} color="white" />
            </View>
            <View style={styles.teacherCopy}>
              <Text style={styles.teacherName}>{workspaceName}</Text>
              <Text style={styles.teacherMeta}>{t('receiptDetail.premiumReceipt')}</Text>
            </View>
          </View>

          <View style={styles.receiptStatusPill}>
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.success} />
            <Text style={styles.receiptStatusText}>{t('receiptDetail.paymentRecorded')}</Text>
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>{t('receiptDetail.amountPaid')}</Text>
            <Text style={styles.amountValue}>{formatLkr(payment.amount)}</Text>
          </View>

          <View style={styles.detailsBox}>
            <ReceiptLine label={t('receiptDetail.student')} value={payment.studentName} />
            {payment.allocations.length > 1 ? (
              <View style={styles.allocationBlock}>
                <Text style={styles.allocationTitle}>{t('receiptDetail.appliedTo')}</Text>
                {payment.allocations.map((line, index) => (
                  <View key={`${line.label}-${index}`} style={styles.allocationRow}>
                    <Text style={styles.allocationLabel}>{line.label}</Text>
                    <Text style={styles.allocationValue}>{formatLkr(line.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <ReceiptLine label={t('receiptDetail.class')} value={payment.className} />
            )}
            <ReceiptLine label={t('receiptDetail.receiptNo')} value={payment.receiptNo} />
            <ReceiptLine label={t('receiptDetail.paidDate')} value={payment.paidAt} />
            <ReceiptLine label={t('receiptDetail.method')} value={payment.method.toUpperCase()} />
            {payment.note ? <ReceiptLine label={t('receiptDetail.note')} value={payment.note} /> : null}
          </View>

          <View style={styles.footerNote}>
            <MaterialCommunityIcons name="shield-check-outline" size={17} color={colors.primary} />
            <Text style={styles.footerNoteText}>{t('receiptDetail.footerNote')}</Text>
          </View>
        </PremiumCard>

        <Pressable onPress={shareReceipt}>
          <PremiumCard style={styles.shareCard}>
            <View style={styles.shareIcon}>
              <MaterialCommunityIcons name="whatsapp" size={24} color={colors.success} />
            </View>
            <View style={styles.shareCopy}>
              <Text style={styles.cardTitle}>{t('receiptDetail.shareTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('receiptDetail.shareSubtitle')}</Text>
            </View>
            <View style={styles.shareButtonSmall}>
              <Text style={styles.shareButtonSmallText}>{t('receiptDetail.share')}</Text>
            </View>
          </PremiumCard>
        </Pressable>
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('receiptDetail.receiptTotal')}</Text>
          <Text style={styles.saveValue}>{formatLkr(payment.amount)}</Text>
        </View>
        <Pressable style={styles.saveButton} onPress={shareReceipt}>
          <MaterialCommunityIcons name="share-variant" size={18} color="white" />
          <Text style={styles.saveButtonText}>{t('receiptDetail.shareReceipt')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function ReceiptDetailScreen() {
  return (
    <PermissionGate permission="record_payments">
      <ReceiptDetailScreenContent />
    </PermissionGate>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptLine}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue}>{value}</Text>
    </View>
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
  heroTitle: { marginTop: 4, color: 'white', fontSize: 26, lineHeight: 31, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  receiptPaperCard: { gap: spacing.lg, borderColor: colors.primarySoft },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoMark: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  teacherCopy: { flex: 1 },
  teacherName: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  teacherMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  receiptStatusPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.successSoft },
  receiptStatusText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  amountBlock: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.background },
  amountLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  amountValue: { marginTop: 5, color: colors.textPrimary, fontSize: 34, fontWeight: '900', letterSpacing: -1.1 },
  detailsBox: { gap: spacing.md, borderRadius: radius.xl, padding: spacing.lg, backgroundColor: colors.background },
  receiptLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  receiptLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  receiptValue: { flex: 1, textAlign: 'right', color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  allocationBlock: { gap: spacing.sm, paddingTop: spacing.xs },
  allocationTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  allocationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  allocationLabel: { flex: 1, color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  allocationValue: { color: colors.success, fontSize: 12, fontWeight: '900' },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  footerNoteText: { flex: 1, color: colors.primary, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  shareCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.successSoft },
  shareIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  shareCopy: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  shareButtonSmall: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.primary },
  shareButtonSmallText: { color: 'white', fontSize: 12, fontWeight: '900' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
