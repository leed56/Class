import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.copy}>Reports, settings, language, subjects, receipts, and account controls.</Text>
        <PremiumCard>
          <Text style={styles.cardTitle}>Reports and settings coming next</Text>
          <Text style={styles.cardCopy}>This area will hold reports, subject setup, receipt settings, language, and privacy controls.</Text>
        </PremiumCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  copy: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  cardCopy: { marginTop: spacing.sm, color: colors.textSecondary, lineHeight: 21, fontWeight: '600' },
});
