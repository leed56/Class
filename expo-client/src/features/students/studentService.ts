import { getCurrentWorkspace } from '@/features/auth/authService';
import { Medium, StudentRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
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

function requireText(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

function mapStudentRow(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.full_name,
    grade: row.grade,
    medium: row.medium,
    school: row.school ?? 'School not set',
    parentName: row.parent_name ?? 'Parent not set',
    parentPhone: row.parent_phone,
    className: 'No class yet',
    feeStatus: 'pending',
    monthlyFee: 0,
    outstandingAmount: 0,
    attendancePercent: 0,
    attendanceTrend: 'watch',
    consentCaptured: row.consent_captured,
  };
}

export async function listStudents() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding students.');

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapStudentRow(row as StudentRow));
}

export async function getStudentById(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing students.');

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('id', studentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapStudentRow(data as StudentRow) : null;
}

export async function createStudent(input: StudentFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding students.');

  const fullName = requireText(input.fullName, 'Student name is required.');
  const parentPhone = requireText(input.parentPhone, 'Parent phone is required.');

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
  return mapStudentRow(data as StudentRow);
}

export async function updateStudent(studentId: string, input: StudentFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before editing students.');

  const { data, error } = await supabase
    .from('students')
    .update({
      full_name: requireText(input.fullName, 'Student name is required.'),
      grade: input.grade,
      medium: input.medium,
      school: input.school?.trim() || null,
      parent_name: input.parentName?.trim() || null,
      parent_phone: requireText(input.parentPhone, 'Parent phone is required.'),
      consent_captured: input.consentCaptured,
    })
    .eq('workspace_id', workspace.id)
    .eq('id', studentId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapStudentRow(data as StudentRow);
}

export async function archiveStudent(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before removing students.');

  const { error } = await supabase
    .from('students')
    .update({ active: false })
    .eq('workspace_id', workspace.id)
    .eq('id', studentId);

  if (error) throw new Error(error.message);
}
