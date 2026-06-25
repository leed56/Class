import { getCurrentWorkspace } from '@/features/auth/authService';
import {
  ensureAdmissionInvoice,
  getStudentFeeSummaries,
} from '@/features/fees/feeService';
import { getAttendanceTrend, getStudentAttendancePercents } from '@/features/attendance/attendanceService';
import { getClassLabelsByStudent } from '@/features/enrollment/enrollmentService';
import { throwServiceError } from '@/i18n/serviceErrors';
import { FeeStatus, Medium, StudentRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { Student } from './types';

export type StudentFormInput = {
  fullName: string;
  grade: number;
  medium: Medium;
  school?: string;
  parentName?: string;
  parentPhone: string;
  consentCaptured: boolean;
};

function requireText(value: string, code: 'studentNameRequired' | 'parentPhoneRequired') {
  const trimmed = value.trim();
  if (!trimmed) throwServiceError(code);
  return trimmed;
}

function mapStudentRow(
  row: StudentRow,
  className = 'No class yet',
  attendancePercent = 0,
  feeStatus: FeeStatus = 'pending',
  monthlyFee = 0,
  outstandingAmount = 0,
): Student {
  return {
    id: row.id,
    name: row.full_name,
    grade: row.grade,
    medium: row.medium,
    school: row.school ?? 'School not set',
    parentName: row.parent_name ?? 'Parent not set',
    parentPhone: row.parent_phone,
    className,
    feeStatus,
    monthlyFee,
    outstandingAmount,
    attendancePercent,
    attendanceTrend: getAttendanceTrend(attendancePercent),
    consentCaptured: row.consent_captured,
  };
}

export async function listStudents() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as StudentRow[];
  const studentIds = rows.map((row) => row.id);
  const [labels, attendancePercents, feeSummaries] = await Promise.all([
    getClassLabelsByStudent(studentIds),
    getStudentAttendancePercents(studentIds),
    getStudentFeeSummaries(studentIds),
  ]);
  return rows.map((row) => {
    const fees = feeSummaries.get(row.id);
    return mapStudentRow(
      row,
      labels.get(row.id) ?? 'No class yet',
      attendancePercents.get(row.id) ?? 0,
      fees?.feeStatus ?? 'pending',
      fees?.monthlyFee ?? 0,
      fees?.outstandingAmount ?? 0,
    );
  });
}

export async function getStudentById(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('id', studentId)
    .eq('active', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const [labels, attendancePercents, feeSummaries] = await Promise.all([
    getClassLabelsByStudent([data.id]),
    getStudentAttendancePercents([data.id]),
    getStudentFeeSummaries([data.id]),
  ]);
  const fees = feeSummaries.get(data.id);
  return mapStudentRow(
    data as StudentRow,
    labels.get(data.id) ?? 'No class yet',
    attendancePercents.get(data.id) ?? 0,
    fees?.feeStatus ?? 'pending',
    fees?.monthlyFee ?? 0,
    fees?.outstandingAmount ?? 0,
  );
}

export async function createStudent(input: StudentFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const fullName = requireText(input.fullName, 'studentNameRequired');
  const parentPhone = requireText(input.parentPhone, 'parentPhoneRequired');

  if (!input.consentCaptured) {
    throwServiceError('parentConsentRequired');
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      workspace_id: workspace.id,
      full_name: fullName,
      grade: input.grade,
      medium: input.medium,
      school: input.school?.trim() || null,
      parent_name: input.parentName?.trim() || null,
      parent_phone: parentPhone,
      consent_captured: input.consentCaptured,
      active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  await ensureAdmissionInvoice(data.id);
  return mapStudentRow(data as StudentRow);
}

export async function updateStudent(studentId: string, input: StudentFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const fullName = requireText(input.fullName, 'studentNameRequired');
  const parentPhone = requireText(input.parentPhone, 'parentPhoneRequired');

  if (!input.consentCaptured) {
    throwServiceError('parentConsentRequired');
  }

  const { data, error } = await supabase
    .from('students')
    .update({
      full_name: fullName,
      grade: input.grade,
      medium: input.medium,
      school: input.school?.trim() || null,
      parent_name: input.parentName?.trim() || null,
      parent_phone: parentPhone,
      consent_captured: input.consentCaptured,
    })
    .eq('workspace_id', workspace.id)
    .eq('id', studentId)
    .eq('active', true)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('studentNotFound');

  const [labels, attendancePercents, feeSummaries] = await Promise.all([
    getClassLabelsByStudent([data.id]),
    getStudentAttendancePercents([data.id]),
    getStudentFeeSummaries([data.id]),
  ]);
  const fees = feeSummaries.get(data.id);
  return mapStudentRow(
    data as StudentRow,
    labels.get(data.id) ?? 'No class yet',
    attendancePercents.get(data.id) ?? 0,
    fees?.feeStatus ?? 'pending',
    fees?.monthlyFee ?? 0,
    fees?.outstandingAmount ?? 0,
  );
}

export async function archiveStudent(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('students')
    .update({ active: false })
    .eq('workspace_id', workspace.id)
    .eq('id', studentId)
    .eq('active', true)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('studentNotFoundOrArchived');
}

export async function listArchivedStudents() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as StudentRow[];
  const studentIds = rows.map((row) => row.id);
  const labels = studentIds.length ? await getClassLabelsByStudent(studentIds) : new Map<string, string>();
  return rows.map((row) => mapStudentRow(row, labels.get(row.id) ?? 'No class yet'));
}

export async function restoreStudent(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredStudents');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('students')
    .update({ active: true })
    .eq('workspace_id', workspace.id)
    .eq('id', studentId)
    .eq('active', false)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('studentNotFoundOrActive');
}
