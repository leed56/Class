import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import {
  getCommunicationStats,
  listMessageDeliveries,
  MessageDelivery,
} from '@/features/communications/communicationService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function statusColor(status: MessageDelivery['status']) {
  if (status === 'sent') return colors.success;
  if (status === 'failed') return colors.danger;
  if (status === 'skipped') return colors.warning;
  return colors.info;
}

function typeLabel(type: MessageDelivery['messageType']) {
  return type.replace('_', ' ');
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-LK', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DeliveryLogScreenContent() {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<MessageDelivery[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, skipped: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function statusLabel(status: MessageDelivery['status']) {
    if (status === 'sent') return t('deliveryLog.statusSent');
    if (status === 'failed') return t('deliveryLog.statusFailed');
    if (status === 'skipped') return t('deliveryLog.statusSkipped');
    return t('deliveryLog.statusDraft');
  }

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deliveries, nextStats] = await Promise.all([listMessageDeliveries(80), getCommunicationStats()]);
      setItems(deliveries);
      setStats(nextStats);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'deliveryLog.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function retryDelivery(item: MessageDelivery) {
    router.push({
      pathname: '/communications/compose',
      params: {
        messageType: item.messageType,
        studentId: item.studentId ?? undefined,
        parentPhone: item.parentPhone,
        initialBody: item.body,
        deliveryId: item.id,
      },
    });
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings/communication" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('deliveryLog.title')}</Text>
            <Text style={styles.subtitle}>{t('deliveryLog.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{t('deliveryLog.heroLabel')}</Text>
          <Text style={styles.heroTitle}>{interpolate(t('deliveryLog.heroTitle'), { sent: stats.sent })}</Text>
          <Text style={styles.heroNote}>
            {interpolate(t('deliveryLog.heroNote'), {
              failed: stats.failed,
              skipped: stats.skipped,
              total: stats.total,
            })}
          </Text>
        </LinearGradient>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PremiumCard style={styles.listCard}>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>{t('deliveryLog.empty')}</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle}>{typeLabel(item.messageType)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor(item.status)}1A` }]}>
                      <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                        {statusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.rowPhone}>{item.parentPhone}</Text>
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <View style={styles.rowFooter}>
                    <Text style={styles.rowTime}>{formatWhen(item.sentAt ?? item.createdAt)}</Text>
                    {item.status === 'failed' ? (
                      <Pressable onPress={() => retryDelivery(item)}>
                        <Text style={styles.retryLink}>{t('deliveryLog.retry')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {item.errorMessage ? <Text style={styles.rowError}>{item.errorMessage}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function DeliveryLogScreen() {
  return (
    <PermissionGate permission="manage_settings">
      <DeliveryLogScreenContent />
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  listCard: { gap: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  list: { gap: spacing.md },
  row: { borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background, gap: spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', textTransform: 'capitalize' },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '900' },
  rowPhone: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  rowBody: { color: colors.textPrimary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  rowFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTime: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  retryLink: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  rowError: { color: colors.danger, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
