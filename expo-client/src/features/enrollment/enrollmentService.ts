import { getCurrentWorkspace } from '@/features/auth/authService';
import { ensureEnrollmentInvoice } from '@/features/fees/feeService';
import { ScheduleState, TuitionClass } from '@/features/classes/models';
import { Student } from '@/features/students/types';
import { throwServiceError } from '@/i18n/serviceErrors';
import { ClassEnrollmentRow, ClassRow, StudentRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type ClassRosterEntry = {
  enrollmentId: string;
  enrolledAt: string;
  student: Student;
};

export type StudentEnrollmentEntry = {
  enrollmentId: string;
  enrolledAt: string;
  tuitionClass: TuitionClass;
};

function formatTime(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = minuteText ?? '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function getScheduleState(row: ClassRow): ScheduleState {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  if (row.weekday !== today) return 'upcoming';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = row.start_time.split(':').map(Number);
  const [endHour, endMinute] = row.end_time.split(':').map(Number);

  if (currentMinutes < startHour * 60 + startMinute) return 'upcoming';
  if (currentMinutes > endHour * 60 + endMinute) return 'completed';
  return 'inProgress';
}

function mapStudentRow(row: StudentRow, className = 'No class yet'): Student {
  return {
    id: row.id,
    name: row.full_name,
    grade: row.grade,
    medium: row.medium,
    school: row.school ?? 'School not set',
    parentName: row.parent_name ?? 'Parent not set',
    parentPhone: row.parent_phone,
    className,
    feeStatus: 'pending',
    monthlyFee: 0,
    outstandingAmount: 0,
    attendancePercent: 0,
    attendanceTrend: 'watch',
    consentCaptured: row.consent_captured,
  };
}

function mapClassRow(row: ClassRow, enrolledCount = 0): TuitionClass {
  return {
    id: row.id,
    subject: row.subject,
    grade: row.grade,
    medium: row.medium,
    hall: row.hall ?? 'Hall not set',
    hallId: row.hall_id,
    branchName: null,
    day: row.weekday,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    monthlyFee: row.monthly_fee,
    capacity: 40,
    enrolledCount,
    attendanceAverage: 0,
    collectionPercent: 0,
    state: getScheduleState(row),
    sector: row.sector ?? null,
    sessionType: row.session_type ?? null,
    qualificationLevel: row.qualification_level ?? null,
    intakeLabel: row.intake_label ?? null,
  };
}

function formatClassLabel(subject: string, _grade: number) {
  return subject;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getEnrollmentCountsByClass(classIds: string[]) {
  if (classIds.length === 0) return new Map<string, number>();

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, number>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, number>();

  const { data, error } = await supabase
    .from('class_enrollments')
    .select('class_id')
    .eq('workspace_id', workspace.id)
    .in('class_id', classIds);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1);
  }
  return counts;
}

export async function getClassLabelsByStudent(studentIds: string[]) {
  if (studentIds.length === 0) return new Map<string, string>();

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, string>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, string>();

  const { data, error } = await supabase
    .from('class_enrollments')
    .select('student_id, classes(subject, grade)')
    .eq('workspace_id', workspace.id)
    .in('student_id', studentIds);

  if (error) throw new Error(error.message);

  const labels = new Map<string, string[]>();
  for (const row of data ?? []) {
    const classInfo = unwrapRelation(row.classes as { subject: string; grade: number } | { subject: string; grade: number }[] | null);
    if (!classInfo) continue;
    const existing = labels.get(row.student_id) ?? [];
    existing.push(formatClassLabel(classInfo.subject, classInfo.grade));
    labels.set(row.student_id, existing);
  }

  const summary = new Map<string, string>();
  for (const [studentId, classLabels] of labels.entries()) {
    if (classLabels.length === 1) {
      summary.set(studentId, classLabels[0]);
    } else if (classLabels.length > 1) {
      summary.set(studentId, `${classLabels[0]} (+${classLabels.length - 1})`);
    }
  }
  return summary;
}

export async function listClassRoster(classId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredEnrollments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('class_enrollments')
    .select('id, enrolled_at, students(*)')
    .eq('workspace_id', workspace.id)
    .eq('class_id', classId)
    .order('enrolled_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const studentRow = unwrapRelation(row.students as StudentRow | StudentRow[] | null);
      if (!studentRow) return null;
      return {
        enrollmentId: row.id,
        enrolledAt: row.enrolled_at,
        student: mapStudentRow(studentRow),
      } satisfies ClassRosterEntry;
    })
    .filter((entry): entry is ClassRosterEntry => entry !== null);
}

export async function listStudentEnrollments(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredEnrollments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('class_enrollments')
    .select('id, enrolled_at, classes(*)')
    .eq('workspace_id', workspace.id)
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const classRow = unwrapRelation(row.classes as ClassRow | ClassRow[] | null);
      if (!classRow) return null;
      return {
        enrollmentId: row.id,
        enrolledAt: row.enrolled_at,
        tuitionClass: mapClassRow(classRow),
      } satisfies StudentEnrollmentEntry;
    })
    .filter((entry): entry is StudentEnrollmentEntry => entry !== null);
}

export async function listAvailableStudentsForClass(classId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredEnrollments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: enrolled, error: enrolledError } = await supabase
    .from('class_enrollments')
    .select('student_id')
    .eq('workspace_id', workspace.id)
    .eq('class_id', classId);

  if (enrolledError) throw new Error(enrolledError.message);

  const enrolledIds = new Set((enrolled ?? []).map((row) => row.student_id));

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('full_name', { ascending: true });

  if (studentsError) throw new Error(studentsError.message);

  return (students ?? [])
    .filter((row) => !enrolledIds.has(row.id))
    .map((row) => mapStudentRow(row as StudentRow));
}

export async function enrollStudentInClass(classId: string, studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredEnrollments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('class_enrollments')
    .insert({
      workspace_id: workspace.id,
      class_id: classId,
      student_id: studentId,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throwServiceError('studentAlreadyEnrolled');
    }
    throw new Error(error.message);
  }

  await ensureEnrollmentInvoice(classId, studentId, new Date(data.enrolled_at));

  return data as ClassEnrollmentRow;
}

export async function unenrollStudentFromClass(classId: string, studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredEnrollments');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { error } = await supabase
    .from('class_enrollments')
    .delete()
    .eq('workspace_id', workspace.id)
    .eq('class_id', classId)
    .eq('student_id', studentId);

  if (error) throw new Error(error.message);
}
