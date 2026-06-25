import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import {
  buildTimetableBoard,
  listTimetableWeekdays,
  type TimetableBoardRow,
} from '@/features/locations/timetableBoardService';
import { listWorkspaceScheduleConflicts } from '@/features/locations/timetableService';
import { ScheduleConflictBanner } from '@/features/locations/components/ScheduleConflictBanner';
import { formatWeekdayName, getCanonicalWeekday, interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function TimetableBoardScreen() {
  return (
    <PermissionGate permission="manage_catalog">
      <TimetableBoardContent />
    </PermissionGate>
  );
}

function TimetableBoardContent() {
  const { locale, t } = useI18n();
  const weekdays = listTimetableWeekdays();
  const [selectedDay, setSelectedDay] = useState(getCanonicalWeekday());
  const [rows, setRows] = useState<TimetableBoardRow[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [scheduleConflicts, setScheduleConflicts] = useState<
    Awaited<ReturnType<typeof listWorkspaceScheduleConflicts>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [board, conflicts] = await Promise.all([
        buildTimetableBoard(selectedDay),
        listWorkspaceScheduleConflicts(),
      ]);
      setRows(board.rows);
      setConflictCount(board.conflicts);
      setScheduleConflicts(conflicts.filter((item) => item.weekday === selectedDay));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('timetableBoard.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedDay, t]);

  useFocusEffect(
    useCallback(() => {
      void loadBoard();
    }, [loadBoard]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings/branches" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('timetableBoard.title')}</Text>
            <Text style={styles.subtitle}>{t('timetableBoard.subtitle')}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {weekdays.map((day) => (
            <Pressable
              key={day}
              style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>
                {formatWeekdayName(locale, day, 'short')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {scheduleConflicts.length > 0 ? (
          <ScheduleConflictBanner conflicts={scheduleConflicts} />
        ) : null}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <PremiumCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </PremiumCard>
        ) : rows.length === 0 ? (
          <PremiumCard style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={28} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{interpolate(t('timetableBoard.emptyTitle'), { day: selectedDay })}</Text>
            <Text style={styles.emptyText}>{t('timetableBoard.emptyText')}</Text>
          </PremiumCard>
        ) : (
          <>
            {conflictCount > 0 ? (
              <View style={styles.conflictBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.conflictText}>
                  {conflictCount === 1
                    ? t('timetableBoard.conflictSingle')
                    : interpolate(t('timetableBoard.conflictMulti'), { count: conflictCount })}
                </Text>
              </View>
            ) : null}

            {rows.map((row) => (
              <PremiumCard key={row.hallId} style={styles.hallCard}>
                <View style={styles.hallHeader}>
                  <MaterialCommunityIcons name="door-open" size={20} color={colors.primary} />
                  <Text style={styles.hallTitle}>{row.hallLabel}</Text>
                  <View style={styles.slotBadge}>
                    <Text style={styles.slotBadgeText}>{row.slots.length}</Text>
                  </View>
                </View>
                <View style={styles.slotGrid}>
                  {row.slots.map((slot) => (
                    <View key={slot.classId} style={styles.slotCell}>
                      <Text style={styles.slotTime}>
                        {slot.startTime} – {slot.endTime}
                      </Text>
                      <Text style={styles.slotSubject} numberOfLines={1}>
                        {slot.subject}
                      </Text>
                      <Text style={styles.slotMeta}>{interpolate(t('timetableBoard.gradeMeta'), { grade: slot.grade })}</Text>
                    </View>
                  ))}
                </View>
              </PremiumCard>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  dayRow: { gap: spacing.sm },
  dayChip: {
    minWidth: 54,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  dayChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  dayChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  dayChipTextActive: { color: 'white' },
  loadingBox: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errorCard: { padding: spacing.lg },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
  emptyCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xxl },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  emptyText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  conflictText: { flex: 1, color: colors.danger, fontSize: 12, fontWeight: '800' },
  hallCard: { gap: spacing.md },
  hallHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hallTitle: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  slotBadge: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  slotBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotCell: {
    width: '48%',
    minHeight: 88,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: 4,
  },
  slotTime: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  slotSubject: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  slotMeta: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
});
