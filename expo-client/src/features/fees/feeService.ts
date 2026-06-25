import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  ClassRow,
  FeeInvoiceRow,
  FeeStatus,
  InvoiceType,
  PaymentMethod,
  PaymentRow,
  StudentRow,
} from '@/lib/database.types';
import { throwServiceError } from '@/i18n/serviceErrors';
import { getSupabase } from '@/lib/supabase';

import { FeeInvoice, PaymentAllocation, PaymentRecord } from './models';
import { calculateProRataMonthlyFee } from './proRata';

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
  classInfo: ClassRow | null,
): FeeInvoice {
  const outstandingAmount = Math.max(0, row.monthly_fee - row.paid_amount);
  const invoiceType = (row.invoice_type ?? 'monthly') as InvoiceType;
  const className =
    classInfo != null
      ? formatClassLabel(classInfo.subject, classInfo.grade)
      : row.description ?? 'Admission fee';
  const monthKey = row.month ?? '';
  const monthLabel =
    row.month != null
      ? formatMonthLabel(row.month)
      : invoiceType === 'monthly'
        ? '—'
        : 'One-time';

  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    invoiceType,
    studentName: student.full_name,
    grade: student.grade,
    medium: student.medium,
    className,
    month: monthLabel,
    monthKey,
    monthlyFee: row.monthly_fee,
    paidAmount: row.paid_amount,
    outstandingAmount,
    status: computeStatus(row),
    parentPhone: student.parent_phone,
    dueDays: getDueDays(row.due_date),
  };
}

type AllocationInvoiceRef = {
  invoice_type: InvoiceType;
  description: string | null;
  month: string | null;
  classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null;
};

function formatAllocationLabel(invoice: AllocationInvoiceRef | null) {
  if (!invoice) return 'Fee';
  const classInfo = unwrapRelation(invoice.classes);
  if (invoice.invoice_type === 'admission') return 'Admission fee';
  if (invoice.invoice_type === 'material') return invoice.description ?? 'Material fee';
  if (invoice.invoice_type === 'exam') return invoice.description ?? 'Exam fee';
  if (classInfo) return formatClassLabel(classInfo.subject, classInfo.grade);
  if (invoice.month) return formatMonthLabel(invoice.month);
  return invoice.description ?? 'Fee';
}

function mapPaymentRow(
  row: PaymentRow,
  studentName: string,
  className: string,
  parentPhone: string,
  allocations: PaymentAllocation[] = [],
): PaymentRecord {
  const isSplit = allocations.length > 1;
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    studentName,
    className: isSplit ? `Split • ${allocations.length} invoices` : className,
    amount: row.amount,
    method: row.method,
    paidAt: formatDisplayDate(row.paid_at),
    receiptNo: row.receipt_no,
    parentPhone,
    note: row.note,
    allocations,
  };
}

async function loadPaymentAllocations(paymentIds: string[]) {
  const map = new Map<string, PaymentAllocation[]>();
  if (paymentIds.length === 0) return map;

  const workspace = await getCurrentWorkspace();
  if (!workspace) return map;

  const supabase = getSupabase();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from('payment_allocations')
    .select('payment_id, amount, fee_invoices(invoice_type, description, month, classes(subject, grade))')
    .eq('workspace_id', workspace.id)
    .in('payment_id', paymentIds);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const invoice = unwrapRelation(
      row.fee_invoices as AllocationInvoiceRef | AllocationInvoiceRef[] | null,
    );
    const label = formatAllocationLabel(invoice);
    const list = map.get(row.payment_id) ?? [];
    list.push({ label, amount: row.amount });
    map.set(row.payment_id, list);
  }

  return map;
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
  if (!workspace) throwServiceError('workspaceRequiredFees');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: enrollments, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select('student_id, class_id, enrolled_at, classes(*)')
    .eq('workspace_id', workspace.id);

  if (enrollmentError) throw new Error(enrollmentError.message);
  if (!enrollments?.length) return;

  const { data: existing, error: existingError } = await supabase
    .from('fee_invoices')
    .select('student_id, class_id')
    .eq('workspace_id', workspace.id)
    .eq('month', monthKey)
    .eq('invoice_type', 'monthly');

  if (existingError) throw new Error(existingError.message);

  const existingKeys = new Set((existing ?? []).map((row) => `${row.student_id}:${row.class_id}`));
  const dueDate = getDueDateForMonth(monthKey);

  const inserts = enrollments
    .map((row) => {
      const classInfo = unwrapRelation(row.classes as ClassRow | ClassRow[] | null);
      if (!classInfo) return null;
      const key = `${row.student_id}:${row.class_id}`;
      if (existingKeys.has(key)) return null;

      const proRataFee = calculateProRataMonthlyFee(
        classInfo.monthly_fee,
        new Date(row.enrolled_at),
        monthKey,
        workspace.pro_rata_enabled ?? true,
      );
      if (proRataFee <= 0) return null;

      return {
        workspace_id: workspace.id,
        student_id: row.student_id,
        class_id: row.class_id,
        month: monthKey,
        invoice_type: 'monthly' as InvoiceType,
        description: null,
        monthly_fee: proRataFee,
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

export async function ensureAdmissionInvoice(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace || workspace.admission_fee_lkr <= 0) return null;

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: existing, error: existingError } = await supabase
    .from('fee_invoices')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('student_id', studentId)
    .eq('invoice_type', 'admission')
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from('fee_invoices')
    .insert({
      workspace_id: workspace.id,
      student_id: studentId,
      class_id: null,
      month: null,
      invoice_type: 'admission',
      description: 'Admission / registration fee',
      monthly_fee: workspace.admission_fee_lkr,
      paid_amount: 0,
      status: 'pending',
      due_date: null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export type CreateOneOffInvoiceInput = {
  studentId: string;
  invoiceType: 'material' | 'exam';
  description: string;
  amountLkr: number;
  classId?: string | null;
};

export async function createOneOffInvoice(input: CreateOneOffInvoiceInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredFees');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const description = input.description.trim();
  if (!description) throwServiceError('chargeDescriptionRequired');

  const amount = Math.round(input.amountLkr);
  if (amount <= 0) throwServiceError('chargeAmountGreaterThanZero');

  const { data, error } = await supabase
    .from('fee_invoices')
    .insert({
      workspace_id: workspace.id,
      student_id: input.studentId,
      class_id: input.classId ?? null,
      month: null,
      invoice_type: input.invoiceType,
      description,
      monthly_fee: amount,
      paid_amount: 0,
      status: 'pending',
      due_date: null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function ensureEnrollmentInvoice(classId: string, studentId: string, enrolledAt = new Date()) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredFees');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const monthKey = getCurrentMonthKey(enrolledAt);

  const { data: classInfo, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('id', classId)
    .maybeSingle();

  if (classError) throw new Error(classError.message);
  if (!classInfo) throwServiceError('classNotFound');

  const { data: existing, error: existingError } = await supabase
    .from('fee_invoices')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('month', monthKey)
    .eq('invoice_type', 'monthly')
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id;

  const proRataFee = calculateProRataMonthlyFee(
    (classInfo as ClassRow).monthly_fee,
    enrolledAt,
    monthKey,
    workspace.pro_rata_enabled ?? true,
  );
  if (proRataFee <= 0) return null;

  const { data, error } = await supabase
    .from('fee_invoices')
    .insert({
      workspace_id: workspace.id,
      student_id: studentId,
      class_id: classId,
      month: monthKey,
      invoice_type: 'monthly',
      description: null,
      monthly_fee: proRataFee,
      paid_amount: 0,
      status: 'pending',
      due_date: getDueDateForMonth(monthKey),
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

async function refreshInvoiceStatuses(monthKey = getCurrentMonthKey()) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const { data: invoices, error } = await supabase
    .from('fee_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .or(`month.eq.${monthKey},invoice_type.eq.admission,invoice_type.eq.material,invoice_type.eq.exam`);

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
  if (!workspace) throwServiceError('workspaceRequiredFees');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const [monthlyResult, admissionResult, oneOffResult] = await Promise.all([
    supabase
      .from('fee_invoices')
      .select('*, students(*), classes(*)')
      .eq('workspace_id', workspace.id)
      .eq('invoice_type', 'monthly')
      .eq('month', monthKey)
      .order('created_at', { ascending: false }),
    supabase
      .from('fee_invoices')
      .select('*, students(*), classes(*)')
      .eq('workspace_id', workspace.id)
      .eq('invoice_type', 'admission')
      .order('created_at', { ascending: false }),
    supabase
      .from('fee_invoices')
      .select('*, students(*), classes(*)')
      .eq('workspace_id', workspace.id)
      .in('invoice_type', ['material', 'exam'])
      .order('created_at', { ascending: false }),
  ]);

  if (monthlyResult.error) throw new Error(monthlyResult.error.message);
  if (admissionResult.error) throw new Error(admissionResult.error.message);
  if (oneOffResult.error) throw new Error(oneOffResult.error.message);

  const rows = [...(monthlyResult.data ?? []), ...(admissionResult.data ?? []), ...(oneOffResult.data ?? [])];

  return rows
    .map((row) => {
      const student = unwrapRelation(row.students as StudentRow | StudentRow[] | null);
      const classInfo = unwrapRelation(row.classes as ClassRow | ClassRow[] | null);
      if (!student) return null;
      if ((row.invoice_type ?? 'monthly') === 'monthly' && !classInfo) return null;
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

export async function listStudentOpenInvoices(studentId: string, monthKey = getCurrentMonthKey()) {
  const invoices = await listInvoicesForMonth(monthKey);
  return invoices
    .filter((invoice) => invoice.studentId === studentId && invoice.outstandingAmount > 0)
    .sort((a, b) => {
      const typeOrder = (type: FeeInvoice['invoiceType']) => {
        if (type === 'admission') return 0;
        if (type === 'material' || type === 'exam') return 1;
        return 2;
      };
      const orderDiff = typeOrder(a.invoiceType) - typeOrder(b.invoiceType);
      if (orderDiff !== 0) return orderDiff;
      return b.outstandingAmount - a.outstandingAmount;
    });
}

export async function getInvoiceById(invoiceId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredFees');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

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
  if (!student) return null;
  if ((data.invoice_type ?? 'monthly') === 'monthly' && !classInfo) return null;

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
  if (!workspace) throwServiceError('workspaceRequiredFees');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('payments')
    .select('*, students(full_name, parent_phone), fee_invoices(class_id, classes(subject, grade))')
    .eq('workspace_id', workspace.id)
    .order('paid_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const allocationMap = await loadPaymentAllocations(rows.map((row) => row.id));

  return rows
    .map((row) => {
      const student = unwrapRelation(
        row.students as { full_name: string; parent_phone: string } | { full_name: string; parent_phone: string }[] | null,
      );
      const invoice = unwrapRelation(
        row.fee_invoices as
          | { class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }
          | { class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }[]
          | null,
      );
      const classInfo = invoice ? unwrapRelation(invoice.classes) : null;
      if (!student) return null;
      const className = classInfo
        ? formatClassLabel(classInfo.subject, classInfo.grade)
        : 'Admission / fees';
      const allocations = allocationMap.get(row.id) ?? [];
      return mapPaymentRow(
        row as PaymentRow,
        student.full_name,
        className,
        student.parent_phone,
        allocations,
      );
    })
    .filter((payment): payment is PaymentRecord => payment !== null);
}

export async function getPaymentByReceiptNo(receiptNo: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredReceipts');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('payments')
    .select('*, students(full_name, parent_phone), fee_invoices(class_id, classes(subject, grade))')
    .eq('workspace_id', workspace.id)
    .eq('receipt_no', receiptNo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const student = unwrapRelation(
    data.students as { full_name: string; parent_phone: string } | { full_name: string; parent_phone: string }[] | null,
  );
  const invoice = unwrapRelation(
    data.fee_invoices as
      | { class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }
      | null,
  );
  const classInfo = invoice ? unwrapRelation(invoice.classes) : null;
  if (!student) return null;

  const allocationMap = await loadPaymentAllocations([data.id]);
  const allocations = allocationMap.get(data.id) ?? [];

  return mapPaymentRow(
    data as PaymentRow,
    student.full_name,
    classInfo ? formatClassLabel(classInfo.subject, classInfo.grade) : 'Admission / fees',
    student.parent_phone,
    allocations,
  );
}

async function generateReceiptNo() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredPayments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

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
  if (!workspace) throwServiceError('workspaceRequiredPayments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) throwServiceError('invoiceNotFound');

  const amount = Math.round(input.amount);
  if (amount <= 0) throwServiceError('paymentAmountGreaterThanZero');
  if (amount > invoice.outstandingAmount) {
    throwServiceError('paymentExceedsOutstandingBalance', {
      amount: invoice.outstandingAmount.toLocaleString('en-LK'),
    });
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

  const { error: allocationError } = await supabase.from('payment_allocations').insert({
    workspace_id: workspace.id,
    payment_id: payment.id,
    invoice_id: invoice.id,
    amount,
  });

  if (allocationError) throw new Error(allocationError.message);

  const nextPaidAmount = invoice.paidAmount + amount;
  const nextOutstanding = Math.max(0, invoice.monthlyFee - nextPaidAmount);
  let nextStatus: FeeStatus = 'partial';
  if (nextOutstanding <= 0) {
    nextStatus = 'paid';
  } else if (nextPaidAmount === 0) {
    nextStatus =
      invoice.monthKey && getDueDays(getDueDateForMonth(invoice.monthKey)) > 0 ? 'overdue' : 'pending';
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
    payment: mapPaymentRow(payment as PaymentRow, invoice.studentName, invoice.className, invoice.parentPhone),
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
    .in('student_id', studentIds)
    .or(`month.eq.${monthKey},invoice_type.eq.admission,invoice_type.eq.material,invoice_type.eq.exam`);

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
  await ensureEnrollmentInvoice(classId, studentId);
  const invoices = await listInvoicesForMonth(monthKey);
  return invoices.find((invoice) => invoice.studentId === studentId && invoice.classId === classId) ?? null;
}

export type SplitPaymentLine = {
  invoiceId: string;
  amount: number;
};

export type RecordSplitPaymentInput = {
  studentId: string;
  lines: SplitPaymentLine[];
  method: PaymentMethod;
  note?: string;
};

export async function recordSplitPayment(input: RecordSplitPaymentInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredPayments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  if (input.lines.length === 0) {
    throwServiceError('selectInvoiceToPay');
  }

  const invoices = await Promise.all(input.lines.map((line) => getInvoiceById(line.invoiceId)));
  const resolved = invoices.filter((invoice): invoice is FeeInvoice => invoice !== null);
  if (resolved.length !== input.lines.length) {
    throwServiceError('invoicesNotFound');
  }

  const studentIds = new Set(resolved.map((invoice) => invoice.studentId));
  if (studentIds.size !== 1 || !studentIds.has(input.studentId)) {
    throwServiceError('splitPaymentSameStudent');
  }

  let totalAmount = 0;
  for (const line of input.lines) {
    const invoice = resolved.find((item) => item.id === line.invoiceId);
    if (!invoice) continue;
    const amount = Math.round(line.amount);
    if (amount <= 0) throwServiceError('splitPaymentLineAmountRequired');
    if (amount > invoice.outstandingAmount) {
      throwServiceError('splitPaymentExceedsInvoiceBalance', { className: invoice.className });
    }
    totalAmount += amount;
  }

  const receiptNo = await generateReceiptNo();
  const primaryInvoiceId = input.lines[0].invoiceId;

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      workspace_id: workspace.id,
      invoice_id: primaryInvoiceId,
      student_id: input.studentId,
      amount: totalAmount,
      method: input.method,
      receipt_no: receiptNo,
      note: input.note?.trim() || null,
    })
    .select('*')
    .single();

  if (paymentError) throw new Error(paymentError.message);

  const allocations = input.lines.map((line) => ({
    workspace_id: workspace.id,
    payment_id: payment.id,
    invoice_id: line.invoiceId,
    amount: Math.round(line.amount),
  }));

  const { error: allocationError } = await supabase.from('payment_allocations').insert(allocations);
  if (allocationError) throw new Error(allocationError.message);

  for (const line of input.lines) {
    const invoice = resolved.find((item) => item.id === line.invoiceId);
    if (!invoice) continue;
    const amount = Math.round(line.amount);
    const nextPaidAmount = invoice.paidAmount + amount;
    const nextOutstanding = Math.max(0, invoice.monthlyFee - nextPaidAmount);
    let nextStatus: FeeStatus = 'partial';
    if (nextOutstanding <= 0) {
      nextStatus = 'paid';
    } else if (nextPaidAmount === 0) {
      nextStatus =
        invoice.monthKey && getDueDays(getDueDateForMonth(invoice.monthKey)) > 0 ? 'overdue' : 'pending';
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
  }

  const primary = resolved[0];
  return {
    receiptNo,
    totalAmount,
    payment: mapPaymentRow(
      payment as PaymentRow,
      primary.studentName,
      resolved.length > 1 ? `${resolved.length} fee lines` : primary.className,
      primary.parentPhone,
    ),
  };
}
