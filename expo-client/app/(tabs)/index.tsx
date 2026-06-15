import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/MetricCard';
import { PremiumCard } from '@/components/PremiumCard';
import { QuickActionTile } from '@/components/QuickActionTile';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Home</Text>
            <Text style={styles.date}>Monday, 15 June 2026</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>NP</Text></View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroChip}><Text style={styles.heroChipText}>Today at a glance</Text></View>
          <Text style={styles.heroTitle}>Good morning,{"\n"}Mr. Nimal Perera</Text>
          <Text style={styles.heroCopy}>You have 4 classes today. 12 students still have pending fees for June.</Text>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <MetricCard label="Classes Today" value="4" icon="calendar-month" tone={colors.primary} />
          <MetricCard label="Attendance" value="87%" icon="trending-up" tone={colors.success} delta="+6% vs May" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Pending Fees" value="12" icon="account-alert" tone={colors.danger} />
          <MetricCard label="Collected" value="LKR 28,450" icon="wallet" tone={colors.success} delta="+18% this month" />
        </View>

        <PremiumCard>
          <Text style={styles.cardTitle}>Next class</Text>
          <View style={styles.classRow}>
            <View style={styles.classIcon}><MaterialCommunityIcons name="calculator" size={24} color={colors.primary} /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Mathematics</Text>
              <Text style={styles.muted}>Grade 9 • English Medium</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>10:30 AM - 12:00 PM</Text>
            <Text style={styles.metaText}>Hall A</Text>
          </View>
          <View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Take Attendance</Text></View>
        </PremiumCard>

        <View>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickRow}>
            <QuickActionTile label="Add Student" icon="account-plus" color={colors.primary} />
            <QuickActionTile label="Create Class" icon="plus-box" color={colors.info} />
            <QuickActionTile label="Payment" icon="cash-plus" color={colors.success} />
            <QuickActionTile label="Message" icon="message-text" color={colors.warning} />
          </View>
        </View>

        <PremiumCard>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Fee collection</Text>
            <Text style={styles.monthChip}>June</Text>
          </View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <View style={styles.feeRow}>
            <FeeValue label="Collected" value="LKR 28,450" color={colors.success} />
            <FeeValue label="Outstanding" value="LKR 19,850" color={colors.danger} />
          </View>
        </PremiumCard>

        <PremiumCard>
          <Text style={styles.cardTitle}>Today's schedule</Text>
          <ScheduleRow time="08:00 AM" title="Mathematics" meta="Grade 10 • English" status="Completed" color={colors.success} />
          <ScheduleRow time="10:30 AM" title="Mathematics" meta="Grade 9 • English" status="Next" color={colors.primary} />
          <ScheduleRow time="01:30 PM" title="Science" meta="Grade 8 • Sinhala" status="Upcoming" color={colors.warning} />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeeValue({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.feeValue}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.feeLabel}>{label}</Text>
        <Text style={styles.feeAmount}>{value}</Text>
      </View>
    </View>
  );
}

function ScheduleRow({ time, title, meta, status, color }: { time: string; title: string; meta: string; status: string; color: string }) {
  return (
    <View style={styles.scheduleRow}>
      <Text style={styles.scheduleTime}>{time}</Text>
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleTitle}>{title}</Text>
        <Text style={styles.scheduleMeta}>{meta}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${color}1F` }]}>
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  date: { marginTop: 4, color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '900' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  heroChipText: { color: 'white', fontWeight: '800' },
  heroTitle: { marginTop: 18, color: 'white', fontSize: 27, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  heroCopy: { marginTop: 10, color: '#E7DEFF', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionTitle: { marginBottom: spacing.md, color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  classRow: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  classIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  classInfo: { flex: 1 },
  className: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  muted: { marginTop: 4, color: colors.textSecondary, fontWeight: '700' },
  metaRow: { marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: colors.textPrimary, fontWeight: '800' },
  primaryButton: { marginTop: spacing.lg, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '900', fontSize: 15 },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthChip: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontWeight: '900' },
  progressTrack: { marginTop: spacing.lg, height: 12, borderRadius: 999, backgroundColor: colors.dangerSoft, overflow: 'hidden' },
  progressFill: { width: '59%', height: '100%', borderRadius: 999, backgroundColor: colors.success },
  feeRow: { marginTop: spacing.lg, flexDirection: 'row', gap: spacing.md },
  feeValue: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  feeLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  feeAmount: { marginTop: 3, color: colors.textPrimary, fontWeight: '900' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg },
  scheduleTime: { width: 72, color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { color: colors.textPrimary, fontWeight: '900' },
  scheduleMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '900' },
});
