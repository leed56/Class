import { getCurrentWorkspace } from '@/features/auth/authService';
import { TEACHER_DISPLAY_FALLBACK } from '@/features/auth/teacherProfile';
import { getCurrentMonthKey, formatMonthLabel } from '@/features/fees/feeService';
import { getHallLabel } from '@/features/locations/branchService';
import { listWorkspaceStaff } from '@/features/auth/staffService';
import { HallBookingRow, HallRentInvoiceRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { throwServiceError } from '@/i18n/serviceErrors';

import {
  HallBooking,
  HallBookingInput,
  HallRentInvoice,
  HallRentStatus,
  HallRentSummary,
} from './models';

function requireText(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

function parseTimeToDb(value: string, message: string) {
  const trimmed = requireText(value, message);
  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = twelveHour[2];
    const period = twelveHour[3].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}:00`;
  }

  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error(message);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  }

  throw new Error(message);
}

function formatDbTime(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = minuteText ?? '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.slice(0, 2)} ${suffix}`;
}

function getDueDays(dueDate: string | null) {
  if (!dueDate) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

function computeRentStatus(row: HallRentInvoiceRow): HallRentStatus {
  const outstanding = Math.max(0, row.amount - row.paid_amount);
  if (outstanding <= 0) return 'paid';
  if (row.paid_amount > 0) return getDueDays(row.due_date) > 0 ? 'overdue' : 'partial';
  return getDueDays(row.due_date) > 0 ? 'overdue' : 'pending';
}

async function buildTeacherNameLookup() {
  const staff = await listWorkspaceStaff();
  return new Map(
    staff.map((member) => [
      member.userId,
      member.fullName.trim() || member.email.split('@')[0] || TEACHER_DISPLAY_FALLBACK,
    ]),
  );
}

function mapBookingRow(
  row: HallBookingRow,
  hallLabel: string,
  teacherName: string,
): HallBooking {
  return {
    id: row.id,
    hallId: row.hall_id,
    hallLabel,
    teacherUserId: row.teacher_user_id,
    teacherName,
    label: row.label,
    weekday: row.weekday,
    startTime: formatDbTime(row.start_time),
    endTime: formatDbTime(row.end_time),
    monthlyRentLkr: row.monthly_rent_lkr,
    active: row.active,
  };
}

function mapInvoiceRow(
  row: HallRentInvoiceRow,
  booking: HallBooking | null,
  teacherName: string,
): HallRentInvoice {
  const outstandingAmount = Math.max(0, row.amount - row.paid_amount);
  const slotLabel = booking
    ? `${booking.weekday} ${booking.startTime}–${booking.endTime}`
    : 'Slot';

  return {
    id: row.id,
    bookingId: row.booking_id,
    teacherUserId: row.teacher_user_id,
    teacherName,
    hallLabel: booking?.hallLabel ?? 'Hall',
    bookingLabel: booking?.label ?? null,
    weekday: booking?.weekday ?? '—',
    slotLabel,
    month: row.month,
    monthLabel: formatMonthLabel(row.month),
    amount: row.amount,
    paidAmount: row.paid_amount,
    outstandingAmount,
    status: computeRentStatus(row),
    dueDate: row.due_date,
  };
}

export async function listHallBookings(includeInactive = false) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from('hall_bookings')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('weekday')
    .order('start_time');

  if (!includeInactive) query = query.eq('active', true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const teacherNames = await buildTeacherNameLookup();
  const rows = (data ?? []) as HallBookingRow[];

  return Promise.all(
    rows.map(async (row) => {
      const hallLabel = (await getHallLabel(row.hall_id)) ?? 'Hall';
      const teacherName = teacherNames.get(row.teacher_user_id) ?? TEACHER_DISPLAY_FALLBACK;
      return mapBookingRow(row, hallLabel, teacherName);
    }),
  );
}

export async function createHallBooking(input: HallBookingInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const startTime = parseTimeToDb(input.startTime, 'Start time is required.');
  const endTime = parseTimeToDb(input.endTime, 'End time is required.');
  if (endTime <= startTime) throwServiceError('endTimeAfterStart');

  const monthlyRent = Math.max(0, Math.round(input.monthlyRentLkr));
  if (monthlyRent <= 0) throwServiceError('monthlyRentRequired');

  const { data, error } = await supabase
    .from('hall_bookings')
    .insert({
      workspace_id: workspace.id,
      hall_id: input.hallId,
      teacher_user_id: input.teacherUserId,
      label: input.label?.trim() || null,
      weekday: requireText(input.weekday, 'Weekday is required.'),
      start_time: startTime,
      end_time: endTime,
      monthly_rent_lkr: monthlyRent,
      active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const teacherNames = await buildTeacherNameLookup();
  const hallLabel = (await getHallLabel(data.hall_id)) ?? 'Hall';
  return mapBookingRow(
    data as HallBookingRow,
    hallLabel,
    teacherNames.get(data.teacher_user_id) ?? TEACHER_DISPLAY_FALLBACK,
  );
}

export async function archiveHallBooking(bookingId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('hall_bookings')
    .update({ active: false })
    .eq('workspace_id', workspace.id)
    .eq('id', bookingId)
    .eq('active', true)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('bookingNotFoundOrArchived');
}

export async function ensureHallRentInvoicesForMonth(monthKey = getCurrentMonthKey()) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const bookings = await listHallBookings();
  if (!bookings.length) return;

  const [year, month] = monthKey.split('-').map(Number);
  const dueDate = `${year}-${String(month).padStart(2, '0')}-05`;

  const inserts = bookings.map((booking) => ({
    workspace_id: workspace.id,
    booking_id: booking.id,
    teacher_user_id: booking.teacherUserId,
    month: monthKey,
    amount: booking.monthlyRentLkr,
    paid_amount: 0,
    due_date: dueDate,
  }));

  const { error } = await supabase
    .from('hall_rent_invoices')
    .upsert(inserts, { onConflict: 'booking_id,month', ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

export async function listHallRentInvoices(monthKey = getCurrentMonthKey()) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  await ensureHallRentInvoicesForMonth(monthKey);

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('hall_rent_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  const [bookings, teacherNames] = await Promise.all([listHallBookings(true), buildTeacherNameLookup()]);
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));

  return ((data ?? []) as HallRentInvoiceRow[]).map((row) =>
    mapInvoiceRow(row, bookingMap.get(row.booking_id) ?? null, teacherNames.get(row.teacher_user_id) ?? TEACHER_DISPLAY_FALLBACK),
  );
}

export async function getHallRentSummary(monthKey = getCurrentMonthKey()): Promise<HallRentSummary> {
  const [invoices, bookings] = await Promise.all([
    listHallRentInvoices(monthKey),
    listHallBookings(),
  ]);

  const collected = invoices.reduce((sum, row) => sum + row.paidAmount, 0);
  const totalDue = invoices.reduce((sum, row) => sum + row.amount, 0);
  const outstanding = invoices.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const defaulterCount = new Set(
    invoices.filter((row) => row.outstandingAmount > 0).map((row) => row.teacherUserId),
  ).size;

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    totalDue,
    collected,
    outstanding,
    defaulterCount,
    activeBookings: bookings.length,
  };
}

export async function recordHallRentPayment(invoiceId: string, amount: number) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const payment = Math.max(0, Math.round(amount));
  if (payment <= 0) throwServiceError('paymentAmountRequired');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: invoice, error: loadError } = await supabase
    .from('hall_rent_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('id', invoiceId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!invoice) throwServiceError('rentInvoiceNotFound');

  const row = invoice as HallRentInvoiceRow;
  const outstanding = Math.max(0, row.amount - row.paid_amount);
  if (outstanding <= 0) throwServiceError('invoiceAlreadySettled');
  if (payment > outstanding) throwServiceError('paymentExceedsOutstandingRent');

  const { error } = await supabase
    .from('hall_rent_invoices')
    .update({ paid_amount: row.paid_amount + payment })
    .eq('workspace_id', workspace.id)
    .eq('id', invoiceId);

  if (error) throw new Error(error.message);
}
