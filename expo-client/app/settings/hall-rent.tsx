import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { listWorkspaceStaff } from '@/features/auth/staffService';
import { formatLkrCompact } from '@/features/auth/teacherProfile';
import {
  archiveHallBooking,
  createHallBooking,
  getHallRentSummary,
  listHallBookings,
  listHallRentInvoices,
  recordHallRentPayment,
} from '@/features/hall-rent/hallRentService';
import { HallBooking, HallRentInvoice, HallRentStatus } from '@/features/hall-rent/models';
import { HallPicker } from '@/features/locations/components/HallPicker';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { interpolate, CLASS_SCHEDULE_WEEKDAYS, listWeekdayOptions, formatWeekdayName, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function statusColor(status: HallRentInvoice['status']) {
  if (status === 'paid') return colors.success;
  if (status === 'overdue') return colors.danger;
  if (status === 'partial') return colors.warning;
  return colors.textSecondary;
}

export default function HallRentScreen() {
  return (
    <PermissionGate permission="manage_hall_rent">
      <HallRentContent />
    </PermissionGate>
  );
}

function HallRentContent() {
  const { locale, t } = useI18n();
  const weekdayOptions = useMemo(
    () => listWeekdayOptions(locale, CLASS_SCHEDULE_WEEKDAYS),
    [locale],
  );
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [invoices, setInvoices] = useState<HallRentInvoice[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getHallRentSummary>> | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([]);
  const [hallId, setHallId] = useState<string | null>(null);
  const [hallLabel, setHallLabel] = useState('');
  const [teacherUserId, setTeacherUserId] = useState('');
  const [label, setLabel] = useState('');
  const [weekday, setWeekday] = useState('Monday');
  const [startTime, setStartTime] = useState('4:00 PM');
  const [endTime, setEndTime] = useState('6:00 PM');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const teacherChipOptions = useMemo(() => teacherOptions.map((option) => option.label), [teacherOptions]);

  const rentStatusLabels = useMemo(
    (): Record<HallRentStatus, string> => ({
      paid: t('common.paid'),
      partial: t('common.partial'),
      pending: t('common.pending'),
      overdue: t('common.overdue'),
    }),
    [t],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextBookings, nextInvoices, nextSummary, staff] = await Promise.all([
        listHallBookings(),
        listHallRentInvoices(),
        getHallRentSummary(),
        listWorkspaceStaff(),
      ]);
      setBookings(nextBookings);
      setInvoices(nextInvoices);
      setSummary(nextSummary);
      const teachers = staff
        .filter((member) => member.role === 'teacher' || member.role === 'owner')
        .map((member) => ({
          id: member.userId,
          label: member.fullName.trim() || member.email.split('@')[0],
        }));
      setTeacherOptions(teachers);
      if (!teacherUserId && teachers[0]) setTeacherUserId(teachers[0].id);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'hallRent.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [teacherUserId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreateBooking() {
    if (!hallId || !teacherUserId) {
      Alert.alert(t('common.error'), t('hallRent.missingDetails'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await createHallBooking({
        hallId,
        teacherUserId,
        label: label.trim() || undefined,
        weekday,
        startTime,
        endTime,
        monthlyRentLkr: Number(monthlyRent.replace(/\D/g, '') || 0),
      });
      setLabel('');
      setMonthlyRent('');
      await load();
    } catch (saveError) {
      setError(resolveServiceErrorMessage(saveError, t, 'hallRent.createBookingFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmArchiveBooking(booking: HallBooking) {
    Alert.alert(t('hallRent.endBooking'), interpolate(t('hallRent.endBookingConfirm'), { teacher: booking.teacherName, hall: booking.hallLabel }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('hallRent.endBooking'),
        style: 'destructive',
        onPress: async () => {
          setWorkingId(booking.id);
          try {
            await archiveHallBooking(booking.id);
            await load();
          } catch (archiveError) {
            Alert.alert(
              t('hallRent.endBookingFailed'),
              resolveServiceErrorMessage(archiveError, t, 'hallRent.endBookingFailed'),
            );
          } finally {
            setWorkingId(null);
          }
        },
      },
    ]);
  }

  function confirmMarkPaid(invoice: HallRentInvoice) {
    Alert.alert(
      t('hallRent.markPaidConfirmTitle'),
      interpolate(t('hallRent.markPaidConfirmMessage'), {
        teacher: invoice.teacherName,
        amount: formatLkrCompact(invoice.outstandingAmount),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('hallRent.markPaid'),
          onPress: async () => {
            setWorkingId(invoice.id);
            setError(null);
            try {
              await recordHallRentPayment(invoice.id, invoice.outstandingAmount);
              await load();
            } catch (paymentError) {
              setError(resolveServiceErrorMessage(paymentError, t, 'hallRent.recordPaymentFailed'));
            } finally {
              setWorkingId(null);
            }
          },
        },
      ],
    );
  }

  function startRecordPayment(invoice: HallRentInvoice) {
    setPaymentInvoiceId(invoice.id);
    setPaymentAmount(String(invoice.outstandingAmount));
  }

  async function handleRecordPayment() {
    if (!paymentInvoiceId) return;
    const amount = Number(paymentAmount.replace(/\D/g, '') || 0);
    if (amount <= 0) {
      Alert.alert(t('common.error'), t('hallRent.paymentRequired'));
      return;
    }

    setWorkingId(paymentInvoiceId);
    setError(null);
    try {
      await recordHallRentPayment(paymentInvoiceId, amount);
      setPaymentInvoiceId(null);
      setPaymentAmount('');
      await load();
    } catch (paymentError) {
      setError(resolveServiceErrorMessage(paymentError, t, 'hallRent.recordPaymentFailed'));
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('hallRent.title')}</Text>
            <Text style={styles.subtitle}>{t('hallRent.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroLabel}>{summary?.monthLabel ?? t('common.thisMonth')}</Text>
          <Text style={styles.heroTitle}>{interpolate(t('hallRent.collected'), { amount: formatLkrCompact(summary?.collected ?? 0) })}</Text>
          <Text style={styles.heroCopy}>
            {interpolate(t('hallRent.outstandingTeachers'), {
              amount: formatLkrCompact(summary?.outstanding ?? 0),
              count: String(summary?.defaulterCount ?? 0),
              slots: String(summary?.activeBookings ?? 0),
            })}
          </Text>
        </LinearGradient>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>{t('hallRent.loading')}</Text>
          </View>
        ) : (
          <>
            <PremiumCard>
              <Text style={styles.cardTitle}>{t('hallRent.bookSlotTitle')}</Text>
              <Text style={styles.cardHint}>{t('hallRent.bookSlotHint')}</Text>

              <HallPicker
                selectedHallId={hallId}
                onSelect={(nextHallId, nextLabel) => {
                  setHallId(nextHallId);
                  setHallLabel(nextLabel);
                }}
              />

              {teacherChipOptions.length > 0 ? (
                <View style={styles.fieldBlock}>
                  <ChoiceChipGroup
                    label={t('hallRent.visitingTeacher')}
                    selected={teacherOptions.find((option) => option.id === teacherUserId)?.label ?? teacherChipOptions[0]}
                    options={teacherChipOptions}
                    onSelect={(name) => {
                      const match = teacherOptions.find((option) => option.label === name);
                      if (match) setTeacherUserId(match.id);
                    }}
                  />
                </View>
              ) : (
                <Text style={styles.cardHint}>{t('hallRent.addTeachersFirst')}</Text>
              )}

              <FormTextField label={t('hallRent.courseLabel')} value={label} onChangeText={setLabel} placeholder={t('hallRent.coursePlaceholder')} icon="book-education-outline" />
              <ChoiceChipGroup label={t('hallRent.weekday')} selected={weekday} options={weekdayOptions} onSelect={setWeekday} />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <FormTextField label={t('hallRent.start')} value={startTime} onChangeText={setStartTime} placeholder={t('hallRent.startTimePlaceholder')} icon="clock-outline" />
                </View>
                <View style={styles.rowItem}>
                  <FormTextField label={t('hallRent.end')} value={endTime} onChangeText={setEndTime} placeholder={t('hallRent.endTimePlaceholder')} icon="clock-outline" />
                </View>
              </View>
              <FormTextField label={t('hallRent.monthlyRent')} value={monthlyRent} onChangeText={setMonthlyRent} placeholder={t('hallRent.monthlyRentPlaceholder')} keyboardType="number-pad" icon="cash" />
              <Pressable style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]} onPress={handleCreateBooking} disabled={isSaving}>
                <Text style={styles.primaryButtonText}>{isSaving ? t('hallRent.saving') : t('hallRent.createBooking')}</Text>
              </Pressable>
              {hallLabel ? <Text style={styles.metaText}>{interpolate(t('hallRent.selectedHall'), { hall: hallLabel })}</Text> : null}
            </PremiumCard>

            <PremiumCard>
              <Text style={styles.cardTitle}>{t('hallRent.activeBookings')}</Text>
              {bookings.length === 0 ? (
                <EmptyState title={t('hallRent.noBookingsTitle')} message={t('hallRent.noBookingsMessage')} icon="door-open" />
              ) : (
                bookings.map((booking) => (
                  <View key={booking.id} style={styles.listRow}>
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>{booking.teacherName}</Text>
                      <Text style={styles.listMeta}>
                        {booking.hallLabel} • {formatWeekdayName(locale, booking.weekday, 'long')} {booking.startTime}–{booking.endTime}
                      </Text>
                      <Text style={styles.listMeta}>
                        {interpolate(t('hallRent.bookingRentMeta'), {
                          slot: booking.label ?? t('hallRent.generalSlot'),
                          fee: formatLkrCompact(booking.monthlyRentLkr),
                          perMonth: t('hallRent.perMonth'),
                        })}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.archiveButton}
                      onPress={() => confirmArchiveBooking(booking)}
                      disabled={workingId === booking.id}
                    >
                      <Text style={styles.archiveButtonText}>{workingId === booking.id ? '…' : t('hallRent.endBooking')}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </PremiumCard>

            <PremiumCard>
              <Text style={styles.cardTitle}>{interpolate(t('hallRent.rentInvoices'), { month: summary?.monthLabel ?? t('common.thisMonth') })}</Text>
              {invoices.length === 0 ? (
                <EmptyState title={t('hallRent.noInvoicesTitle')} message={t('hallRent.noInvoicesMessage')} icon="file-document-outline" />
              ) : (
                invoices.map((invoice) => (
                  <View key={invoice.id} style={styles.listRow}>
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>{invoice.teacherName}</Text>
                      <Text style={styles.listMeta}>
                        {invoice.hallLabel} • {invoice.slotLabel}
                      </Text>
                      <Text style={styles.listMeta}>
                        {interpolate(t('hallRent.duePaid'), {
                          due: formatLkrCompact(invoice.amount),
                          paid: formatLkrCompact(invoice.paidAmount),
                        })}
                      </Text>
                    </View>
                    <View style={styles.invoiceActions}>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor(invoice.status)}1F` }]}>
                        <Text style={[styles.statusText, { color: statusColor(invoice.status) }]}>
                          {rentStatusLabels[invoice.status]}
                        </Text>
                      </View>
                      {invoice.outstandingAmount > 0 ? (
                        <View style={styles.payButtonRow}>
                          <Pressable style={styles.markPaidButton} onPress={() => confirmMarkPaid(invoice)} disabled={workingId === invoice.id}>
                            <Text style={styles.markPaidButtonText}>{workingId === invoice.id ? '…' : t('hallRent.markPaid')}</Text>
                          </Pressable>
                          <Pressable style={styles.payButton} onPress={() => startRecordPayment(invoice)} disabled={workingId === invoice.id}>
                            <Text style={styles.payButtonText}>{t('hallRent.recordPartial')}</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))
              )}

              {paymentInvoiceId ? (
                <View style={styles.paymentPanel}>
                  <Text style={styles.fieldLabel}>{t('hallRent.recordPaymentTitle')}</Text>
                  <FormTextField label={t('hallRent.amountLabel')} value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="number-pad" placeholder={t('hallRent.amountPlaceholder')} icon="cash" />
                  <View style={styles.paymentActions}>
                    <Pressable style={styles.archiveButton} onPress={() => setPaymentInvoiceId(null)}>
                      <Text style={styles.archiveButtonText}>{t('common.cancel')}</Text>
                    </Pressable>
                    <Pressable style={styles.primaryButtonInline} onPress={handleRecordPayment} disabled={workingId === paymentInvoiceId}>
                      <Text style={styles.primaryButtonText}>{workingId === paymentInvoiceId ? t('hallRent.saving') : t('hallRent.savePayment')}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </PremiumCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, gap: spacing.sm },
  heroLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '800' },
  heroTitle: { color: 'white', fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  heroCopy: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  loadingBlock: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  cardHint: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  fieldBlock: { gap: spacing.sm },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  metaText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listCopy: { flex: 1, gap: 3 },
  listTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  listMeta: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  archiveButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  archiveButtonText: { color: colors.danger, fontSize: 11, fontWeight: '900' },
  invoiceActions: { alignItems: 'flex-end', gap: spacing.xs },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  payButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  payButtonRow: { flexDirection: 'row', gap: spacing.xs },
  markPaidButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  markPaidButtonText: { color: 'white', fontSize: 11, fontWeight: '900' },
  payButtonText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  paymentPanel: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  paymentActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  primaryButtonInline: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
