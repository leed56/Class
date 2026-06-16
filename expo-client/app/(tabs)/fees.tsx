import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/MetricCard';
import { PremiumCard } from '@/components/PremiumCard';
import { FeeInvoiceCard } from '@/features/fees/components/FeeInvoiceCard';
import { PaymentRow } from '@/features/fees/components/PaymentRow';
import { mockFeeInvoices, mockPayments } from '@/features/fees/data/mockFees';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const collected = mockFeeInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
const outstanding = mockFeeInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
const total = collected + outstanding;
const collectionPercent = total === 0 ? 0 : Math.round((collected / total) * 100);
const defaulterCount = mockFeeInvoices.filter((invoice) => invoice.outstandingAmount > 0).length;

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function FeesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Fees</Text>
            <Text style={styles.subtitle}>Track monthly tuition fees, cash payments, receipts and defaulters.</Text>
          </View>
          <Link href="/fees/record-payment" asChild>
            <Pressable style={styles.addButton}>
              <MaterialCommunityIcons name="cash-plus" size={23} color="white" />
            </Pressable>
          </Link>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>June collection</Text>
              <Text style={styles.heroValue}>{collectionPercent}% collected</Text>
            </View>
            <View style={styles.monthPill}>
              <MaterialCommunityIcons name="calendar-month" size={15} color="white" />
              <Text style={styles.monthText}>June</Text>
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

        <View style={styles.metricsRow}>
          <MetricCard label="Outstanding" value={formatLkr(outstanding)} icon="cash-alert" tone={colors.danger} />
          <MetricCard label="Defaulters" value={`${defaulterCount}`} icon="account-alert" tone={colors.warning} />
        </View>

        <View style={styles.actionRow}>
          <Link href="/fees/record-payment" asChild>
            <Pressable style={styles.primaryAction}>
              <MaterialCommunityIcons name="cash-register" size={19} color="white" />
              <Text style={styles.primaryActionText}>Record Payment</Text>
            </Pressable>
          </Link>
          <View style={styles.secondaryAction}>
            <MaterialCommunityIcons name="whatsapp" size={19} color={colors.success} />
            <Text style={styles.secondaryActionText}>Send Reminders</Text>
          </View>
        </View>

        <PremiumCard style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.danger} />
          </View>
          <View style={styles.alertTextBlock}>
            <Text style={styles.alertTitle}>Highest-value follow-up</Text>
            <Text style={styles.alertCopy}>{defaulterCount} parents can receive a WhatsApp fee reminder today.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Outstanding fees</Text>
          <Text style={styles.sectionAction}>View all</Text>
        </View>

        <View style={styles.list}>
          {mockFeeInvoices.map((invoice) => (
            <FeeInvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </View>

        <PremiumCard>
          <View style={styles.sectionHeaderInsideCard}>
            <Text style={styles.cardTitle}>Recent payments</Text>
            <Text style={styles.sectionAction}>Receipts</Text>
          </View>
          <View style={styles.paymentsList}>
            {mockPayments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </View>
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 32,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 280,
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  hero: {
    borderRadius: radius.hero,
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroLabel: {
    color: '#E7DEFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroValue: {
    marginTop: 4,
    color: 'white',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.9,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  monthText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
  },
  heroProgressTrack: {
    marginTop: spacing.xl,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'white',
  },
  heroStatsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  heroStatLabel: {
    color: '#E7DEFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroStatValue: {
    marginTop: 4,
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryAction: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryAction: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.successSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryActionText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '900',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.dangerSoft,
  },
  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextBlock: {
    flex: 1,
  },
  alertTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  alertCopy: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderInsideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  list: {
    gap: spacing.md,
  },
  paymentsList: {
    gap: spacing.xs,
  },
});