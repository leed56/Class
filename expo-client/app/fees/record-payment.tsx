import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { FormTextField } from '@/features/students/components/FormTextField';
import { mockFeeInvoices } from '@/features/fees/data/mockFees';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const invoice = mockFeeInvoices.find((item) => item.outstandingAmount > 0) ?? mockFeeInvoices[0];
const receiptNumber = 'RCPT-0004';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function RecordPaymentScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
          <FormTextField label="Amount received" placeholder={`${invoice.outstandingAmount}`} icon="cash" keyboardType="number-pad" />
          <View style={styles.methodBlock}>
            <Text style={styles.inputLabel}>Payment method</Text>
            <View style={styles.methodRow}>
              <MethodChip label="Cash" icon="cash" active />
              <MethodChip label="Bank" icon="bank-outline" />
              <MethodChip label="Online" icon="credit-card-outline" />
            </View>
          </View>
          <FormTextField label="Note" placeholder="Optional payment note" icon="note-text-outline" />
        </PremiumCard>

        <PremiumCard style={styles.receiptCard}>
          <View style={styles.receiptTopRow}>
            <View>
              <Text style={styles.cardTitle}>Receipt preview</Text>
              <Text style={styles.cardSubtitle}>Ready to share after saving</Text>
            </View>
            <View style={styles.receiptNoPill}>
              <Text style={styles.receiptNoText}>{receiptNumber}</Text>
            </View>
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
              <Text style={styles.receiptAmount}>{formatLkr(invoice.outstandingAmount)}</Text>
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
          <Text style={styles.saveValue}>{formatLkr(invoice.outstandingAmount)}</Text>
        </View>
        <View style={styles.saveButton}>
          <MaterialCommunityIcons name="receipt-text-check" size={18} color="white" />
          <Text style={styles.saveButtonText}>Record</Text>
        </View>
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

function MethodChip({ label, icon, active = false }: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; active?: boolean }) {
  return (
    <View style={[styles.methodChip, active && styles.methodChipActive]}>
      <MaterialCommunityIcons name={icon} size={17} color={active ? 'white' : colors.textSecondary} />
      <Text style={[styles.methodText, active && styles.methodTextActive]}>{label}</Text>
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
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
