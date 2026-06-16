import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  ClassRow,
  FeeInvoiceRow,
  FeeStatus,
  PaymentMethod,
  PaymentRow,
  StudentRow,
} from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

import { FeeInvoice, PaymentRecord } from './models';

export type FeeSummary = {
  monthKey: string;
  monthLabel: string;
  collected: number;
  outstanding: number;
  collectionPercent: number;
  defaulterCount: number;
  invoiceCount: number;
};

export type StudentFeeSummary = {
  feeStatus: FeeStatus;
  monthlyFee: number;
  outstandingAmount: number;
  paidAmount: number;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-LK', { month: 'long', year: 'numeric' });
}

function formatClassLabel(subject: string, grade: number) {
  return `${subject} - Grade ${grade}`;
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDueDateForMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-10`;
}

function getDueDays(dueDate: string | null) {
  if (!dueDate) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function computeStatus(row: FeeInvoiceRow) {
  const outstanding = Math.max(0, row.monthly_fee - row.paid_amount);
  if (outstanding <= 0) return 'paid' as FeeStatus;

  const overdue = row.due_date ? getDueDays(row.due_date) > 0 : false;
  if (row.paid_amount > 0) return overdue && outstanding > 0 ? 'overdue' : 'partial';
  return overdue ? 'overdue' : 'pending';
}

function mapInvoiceRow(
  row: FeeInvoiceRow,
  student: StudentRow,
  classInfo: ClassRow,
): FeeInvoice {
  const outstandingAmount = Math.max(0, row.monthly_fee - row.paid_amount);
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    studentName: student.full_name,
    grade: student.grade,
    medium: student.medium,
    className: formatClassLabel(classInfo.subject, classInfo.grade),
    month: formatMonthLabel(row.month),
    monthKey: row.month,
    monthlyFee: row.monthly_fee,
    paidAmount: row.paid_amount,
    outstandingAmount,
    status: computeStatus(row),
    parentPhone: student.parent_phone,
    dueDays: getDueDays(row.due_date),
  };
}

function mapPaymentRow(
  row: PaymentRow,
  studentName: string,
  className: string,
): PaymentRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    studentName,
    className,
    amount: row.amount,
    method: row.method,
    paidAt: formatDisplayDate(row.paid_at),
    receiptNo: row.receipt_no,
    note: row.note,
  };
}

function worstFeeStatus(statuses: FeeStatus[]): FeeStatus {
  const priority: FeeStatus[] = ['overdue', 'partial', 'pending', 'paid'];
  for (const status of priority) {
    if (statuses.includes(status)) return status;
  }
  return 'pending';
}

export async function ensureMonthlyInvoices(monthKey = getCurrentMonthKey()) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing fees.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: enrollments, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select('student_id, class_id, classes(*)')
    .eq('workspace_id', workspace.id);

  if (enrollmentError) throw new Error(enrollmentError.message);
  if (!enrollments?.length) return;

  const { data: existing, error: existingError } = await supabase
    .from('fee_invoices')
    .select('student_id, class_id')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey);

  if (existingError) throw new Error(existingError.message);

  const existingKeys = new Set((existing ?? []).map((row) => `${row.student_id}:${row.class_id}`));
  const dueDate = getDueDateForMonth(monthKey);

  const inserts = enrollments
    .map((row) => {
      const classInfo = unwrapRelation(row.classes as ClassRow | ClassRow[] | null);
      if (!classInfo) return null;
      const key = `${row.student_id}:${row.class_id}`;
      if (existingKeys.has(key)) return null;
      return {
        workspace_id: workspace.id,
        student_id: row.student_id,
        class_id: row.class_id,
        month: monthKey,
        monthly_fee: classInfo.monthly_fee,
        paid_amount: 0,
        status: 'pending' as FeeStatus,
        due_date: dueDate,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (inserts.length === 0) return;

  const { error: insertError } = await supabase.from('fee_invoices').insert(inserts);
  if (insertError) throw new Error(insertError.message);
}

async function refreshInvoiceStatuses(monthKey: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const { data: invoices, error } = await supabase
    .from('fee_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey);

  if (error) throw new Error(error.message);

  for (const invoice of invoices ?? []) {
    const nextStatus = computeStatus(invoice as FeeInvoiceRow);
    if (nextStatus !== invoice.status) {
      await supabase
        .from('fee_invoices')
        .update({ status: nextStatus })
        .eq('id', invoice.id)
        .eq('workspace_id', workspace.id);
    }
  }
}

export async function listInvoicesForMonth(monthKey = getCurrentMonthKey()) {
  await ensureMonthlyInvoices(monthKey);
  await refreshInvoiceStatuses(monthKey);

  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing fees.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('fee_invoices')
    .select('*, students(*), classes(*)')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const student = unwrapRelation(row.students as StudentRow | StudentRow[] | null);
      const classInfo = unwrapRelation(row.classes as ClassRow | ClassRow[] | null);
      if (!student || !classInfo) return null;
      return mapInvoiceRow(row as FeeInvoiceRow, student, classInfo);
    })
    .filter((invoice): invoice is FeeInvoice => invoice !== null);
}

export async function listOutstandingInvoices(monthKey = getCurrentMonthKey()) {
  const invoices = await listInvoicesForMonth(monthKey);
  return invoices
    .filter((invoice) => invoice.outstandingAmount > 0)
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount);
}

export async function getInvoiceById(invoiceId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing fees.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('fee_invoices')
    .select('*, students(*), classes(*)')
    .eq('workspace_id', workspace.id)
    .eq('id', invoiceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const student = unwrapRelation(data.students as StudentRow | StudentRow[] | null);
  const classInfo = unwrapRelation(data.classes as ClassRow | ClassRow[] | null);
  if (!student || !classInfo) return null;

  return mapInvoiceRow(data as FeeInvoiceRow, student, classInfo);
}

export async function getFeeSummaryForMonth(monthKey = getCurrentMonthKey()): Promise<FeeSummary> {
  const invoices = await listInvoicesForMonth(monthKey);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const total = collected + outstanding;

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    collected,
    outstanding,
    collectionPercent: total === 0 ? 0 : Math.round((collected / total) * 100),
    defaulterCount: invoices.filter((invoice) => invoice.outstandingAmount > 0).length,
    invoiceCount: invoices.length,
  };
}

export async function listRecentPayments(limit = 10) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing fees.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('payments')
    .select('*, students(full_name), fee_invoices(class_id, classes(subject, grade))')
    .eq('workspace_id', workspace.id)
    .order('paid_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const student = unwrapRelation(row.students as { full_name: string } | { full_name: string }[] | null);
      const invoice = unwrapRelation(
        row.fee_invoices as
          | { class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }
          | { class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }[]
          | null,
      );
      const classInfo = invoice ? unwrapRelation(invoice.classes) : null;
      if (!student || !classInfo) return null;
      return mapPaymentRow(
        row as PaymentRow,
        student.full_name,
        formatClassLabel(classInfo.subject, classInfo.grade),
      );
    })
    .filter((payment): payment is PaymentRecord => payment !== null);
}

export async function getPaymentByReceiptNo(receiptNo: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing receipts.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('payments')
    .select('*, students(full_name), fee_invoices(class_id, classes(subject, grade))')
    .eq('workspace_id', workspace.id)
    .eq('receipt_no', receiptNo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const student = unwrapRelation(data.students as { full_name: string } | { full_name: string }[] | null);
  const invoice = unwrapRelation(
    data.fee_invoices as
      | { class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }
      | null,
  );
  const classInfo = invoice ? unwrapRelation(invoice.classes) : null;
  if (!student || !classInfo) return null;

  return mapPaymentRow(
    data as PaymentRow,
    student.full_name,
    formatClassLabel(classInfo.subject, classInfo.grade),
  );
}

async function generateReceiptNo() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before recording payments.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('payments')
    .select('receipt_no')
    .eq('workspace_id', workspace.id)
    .order('paid_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  let max = 0;
  for (const row of data ?? []) {
    const match = row.receipt_no.match(/RCPT-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  }

  return `RCPT-${String(max + 1).padStart(4, '0')}`;
}

export type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
};

export async function recordPayment(input: RecordPaymentInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before recording payments.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) throw new Error('Invoice not found.');

  const amount = Math.round(input.amount);
  if (amount <= 0) throw new Error('Enter a payment amount greater than zero.');
  if (amount > invoice.outstandingAmount) {
    throw new Error(`Amount cannot exceed the outstanding balance of LKR ${invoice.outstandingAmount.toLocaleString('en-LK')}.`);
  }

  const receiptNo = await generateReceiptNo();

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      workspace_id: workspace.id,
      invoice_id: invoice.id,
      student_id: invoice.studentId,
      amount,
      method: input.method,
      receipt_no: receiptNo,
      note: input.note?.trim() || null,
    })
    .select('*')
    .single();

  if (paymentError) throw new Error(paymentError.message);

  const nextPaidAmount = invoice.paidAmount + amount;
  const nextOutstanding = Math.max(0, invoice.monthlyFee - nextPaidAmount);
  let nextStatus: FeeStatus = 'partial';
  if (nextOutstanding <= 0) {
    nextStatus = 'paid';
  } else if (nextPaidAmount === 0) {
    nextStatus = getDueDays(getDueDateForMonth(invoice.monthKey)) > 0 ? 'overdue' : 'pending';
  }

  const { error: invoiceError } = await supabase
    .from('fee_invoices')
    .update({
      paid_amount: nextPaidAmount,
      status: nextStatus,
    })
    .eq('workspace_id', workspace.id)
    .eq('id', invoice.id);

  if (invoiceError) throw new Error(invoiceError.message);

  return {
    payment: mapPaymentRow(payment as PaymentRow, invoice.studentName, invoice.className),
    invoice: {
      ...invoice,
      paidAmount: nextPaidAmount,
      outstandingAmount: nextOutstanding,
      status: nextStatus,
    },
  };
}

export async function getStudentFeeSummaries(studentIds: string[], monthKey = getCurrentMonthKey()) {
  if (studentIds.length === 0) return new Map<string, StudentFeeSummary>();

  await ensureMonthlyInvoices(monthKey);

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, StudentFeeSummary>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, StudentFeeSummary>();

  const { data, error } = await supabase
    .from('fee_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey)
    .in('student_id', studentIds);

  if (error) throw new Error(error.message);

  const grouped = new Map<string, FeeInvoiceRow[]>();
  for (const row of (data ?? []) as FeeInvoiceRow[]) {
    const bucket = grouped.get(row.student_id) ?? [];
    bucket.push(row);
    grouped.set(row.student_id, bucket);
  }

  const summaries = new Map<string, StudentFeeSummary>();
  for (const studentId of studentIds) {
    const invoices = grouped.get(studentId) ?? [];
    if (invoices.length === 0) {
      summaries.set(studentId, {
        feeStatus: 'pending',
        monthlyFee: 0,
        outstandingAmount: 0,
        paidAmount: 0,
      });
      continue;
    }

    const monthlyFee = invoices.reduce((sum, invoice) => sum + invoice.monthly_fee, 0);
    const paidAmount = invoices.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
    const outstandingAmount = invoices.reduce(
      (sum, invoice) => sum + Math.max(0, invoice.monthly_fee - invoice.paid_amount),
      0,
    );
    const statuses = invoices.map((invoice) => computeStatus(invoice));

    summaries.set(studentId, {
      feeStatus: worstFeeStatus(statuses),
      monthlyFee,
      outstandingAmount,
      paidAmount,
    });
  }

  return summaries;
}

export async function getClassCollectionPercents(classIds: string[], monthKey = getCurrentMonthKey()) {
  if (classIds.length === 0) return new Map<string, number>();

  await ensureMonthlyInvoices(monthKey);

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, number>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, number>();

  const { data, error } = await supabase
    .from('fee_invoices')
    .select('class_id, monthly_fee, paid_amount')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey)
    .in('class_id', classIds);

  if (error) throw new Error(error.message);

  const grouped = new Map<string, { collected: number; total: number }>();
  for (const row of data ?? []) {
    const bucket = grouped.get(row.class_id) ?? { collected: 0, total: 0 };
    bucket.collected += row.paid_amount;
    bucket.total += row.monthly_fee;
    grouped.set(row.class_id, bucket);
  }

  const percents = new Map<string, number>();
  for (const classId of classIds) {
    const bucket = grouped.get(classId);
    if (!bucket || bucket.total === 0) {
      percents.set(classId, 0);
      continue;
    }
    percents.set(classId, Math.round((bucket.collected / bucket.total) * 100));
  }

  return percents;
}

export async function getInvoiceForEnrollment(studentId: string, classId: string, monthKey = getCurrentMonthKey()) {
  await ensureMonthlyInvoices(monthKey);
  const invoices = await listInvoicesForMonth(monthKey);
  return invoices.find((invoice) => invoice.studentId === studentId && invoice.classId === classId) ?? null;
}
