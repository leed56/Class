import { getCurrentWorkspace } from '@/features/auth/authService';
import { getClassById } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { listClassRoster } from '@/features/enrollment/enrollmentService';
import { throwServiceError } from '@/i18n/serviceErrors';
import { AttendanceMarkRow, AttendanceSessionRow, AttendanceStatus as DbAttendanceStatus } from '@/lib/database.types';
import { isLikelyNetworkError, isOnline } from '@/lib/network';
import { getSupabase } from '@/lib/supabase';

import {
  countPendingAttendanceMarks,
  enqueueAttendanceMark,
  listPendingAttendanceMarks,
  mergePendingMarks,
  removeAttendanceMarks,
} from './offlineAttendanceStore';
import { AttendanceSession, AttendanceStatus, AttendanceStudent } from './models';

export type AttendanceSheet = {
  session: AttendanceSessionRow;
  tuitionClass: TuitionClass;
  students: AttendanceStudent[];
};

export type AttendanceSessionSummary = {
  id: string;
  sessionDate: string;
  displayDate: string;
  status: AttendanceSessionRow['status'];
  presentCount: number;
  lateCount: number;
  absentCount: number;
  markedCount: number;
};

export type StudentAttendanceHistoryEntry = {
  id: string;
  sessionId: string;
  sessionDate: string;
  displayDate: string;
  classId: string;
  classLabel: string;
  status: Exclude<AttendanceStatus, 'unmarked'>;
};

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-LK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toUiStatus(status: DbAttendanceStatus | null | undefined): AttendanceStatus {
  if (!status) return 'unmarked';
  return status;
}

function nextStatus(current: AttendanceStatus): AttendanceStatus {
  if (current === 'unmarked') return 'present';
  if (current === 'present') return 'late';
  if (current === 'late') return 'absent';
  return 'unmarked';
}

function formatLastSeen(status: DbAttendanceStatus | null): Exclude<AttendanceStatus, 'unmarked'> | null {
  if (!status) return null;
  return status;
}

function mapSession(classInfo: TuitionClass, session: AttendanceSessionRow): AttendanceSession {
  return {
    id: session.id,
    subject: classInfo.subject,
    grade: classInfo.grade,
    medium: classInfo.medium,
    hall: classInfo.hall,
    date: formatDisplayDate(session.session_date),
    startTime: classInfo.startTime,
    endTime: classInfo.endTime,
    totalStudents: classInfo.enrolledCount,
  };
}

async function getOrCreateSession(classId: string, sessionDate = formatLocalDate()) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendance');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: existing, error: existingError } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('class_id', classId)
    .eq('session_date', sessionDate)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing as AttendanceSessionRow;

  const { data: created, error: createError } = await supabase
    .from('attendance_sessions')
    .insert({
      workspace_id: workspace.id,
      class_id: classId,
      session_date: sessionDate,
      status: 'draft',
    })
    .select('*')
    .single();

  if (createError) {
    if (createError.code === '23505') {
      const { data: raced, error: raceError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('class_id', classId)
        .eq('session_date', sessionDate)
        .single();
      if (raceError) throw new Error(raceError.message);
      return raced as AttendanceSessionRow;
    }
    throw new Error(createError.message);
  }

  return created as AttendanceSessionRow;
}

async function getLastMarksForClass(classId: string, studentIds: string[], beforeSessionId: string) {
  if (studentIds.length === 0) return new Map<string, DbAttendanceStatus>();

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, DbAttendanceStatus>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, DbAttendanceStatus>();

  const { data, error } = await supabase
    .from('attendance_marks')
    .select('student_id, status, marked_at, attendance_sessions!inner(id, class_id, session_date)')
    .eq('workspace_id', workspace.id)
    .in('student_id', studentIds)
    .neq('session_id', beforeSessionId);

  if (error) throw new Error(error.message);

  const latest = new Map<string, { status: DbAttendanceStatus; markedAt: string }>();
  for (const row of data ?? []) {
    const session = unwrapRelation(row.attendance_sessions as { id: string; class_id: string; session_date: string } | { id: string; class_id: string; session_date: string }[] | null);
    if (!session || session.class_id !== classId) continue;

    const existing = latest.get(row.student_id);
    if (!existing || row.marked_at > existing.markedAt) {
      latest.set(row.student_id, { status: row.status as DbAttendanceStatus, markedAt: row.marked_at });
    }
  }

  return new Map([...latest.entries()].map(([studentId, value]) => [studentId, value.status]));
}

export async function loadAttendanceSheet(classId: string, sessionDate = formatLocalDate()) {
  const tuitionClass = await getClassById(classId);
  if (!tuitionClass) throwServiceError('classNotFound');

  const session = await getOrCreateSession(classId, sessionDate);
  const roster = await listClassRoster(classId);

  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendance');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: marks, error: marksError } = await supabase
    .from('attendance_marks')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('session_id', session.id);

  if (marksError) throw new Error(marksError.message);

  const markByStudent = new Map((marks ?? []).map((row) => [row.student_id, row as AttendanceMarkRow]));
  const studentIds = roster.map((entry) => entry.student.id);
  const lastMarks = await getLastMarksForClass(classId, studentIds, session.id);

  const students: AttendanceStudent[] = roster.map((entry) => {
    const mark = markByStudent.get(entry.student.id);
    return {
      id: entry.student.id,
      name: entry.student.name,
      grade: entry.student.grade,
      medium: entry.student.medium,
      parentPhone: entry.student.parentPhone,
      consentCaptured: entry.student.consentCaptured,
      feeStatus: entry.student.feeStatus,
      attendanceStatus: toUiStatus(mark?.status),
      lastMarkStatus: formatLastSeen(lastMarks.get(entry.student.id) ?? null),
    };
  });

  const pending = await listPendingAttendanceMarks(workspace.id, session.id);

  return {
    session,
    sessionView: mapSession(tuitionClass, session),
    tuitionClass,
    students: mergePendingMarks(students, pending),
    pendingSyncCount: pending.length,
  } satisfies AttendanceSheet & { sessionView: AttendanceSession; pendingSyncCount: number };
}

async function persistStudentAttendance(
  workspaceId: string,
  sessionId: string,
  classId: string,
  sessionDate: string,
  studentId: string,
  status: AttendanceStatus,
) {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  if (status === 'unmarked') {
    const { error } = await supabase
      .from('attendance_marks')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('session_id', sessionId)
      .eq('student_id', studentId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('attendance_marks').upsert(
    {
      workspace_id: workspaceId,
      session_id: sessionId,
      student_id: studentId,
      status: status as DbAttendanceStatus,
      marked_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,student_id' },
  );

  if (error) throw error;
}

export async function syncOfflineAttendanceForSession(sessionId: string, classId: string, sessionDate: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendanceSync');

  const pending = await listPendingAttendanceMarks(workspace.id, sessionId);
  if (pending.length === 0) return { synced: 0, failed: 0 };

  const syncedIds: string[] = [];
  let failed = 0;

  for (const item of pending) {
    try {
      await persistStudentAttendance(
        workspace.id,
        sessionId,
        classId,
        sessionDate,
        item.studentId,
        item.status,
      );
      syncedIds.push(item.id);
    } catch {
      failed += 1;
    }
  }

  await removeAttendanceMarks(syncedIds);

  if (syncedIds.length > 0) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('attendance_sessions')
        .update({ status: 'synced' })
        .eq('workspace_id', workspace.id)
        .eq('id', sessionId);
    }
  }

  return { synced: syncedIds.length, failed };
}

export async function getPendingAttendanceSyncCount(sessionId?: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return 0;
  return countPendingAttendanceMarks(workspace.id, sessionId);
}

export async function markStudentPresent(
  sessionId: string,
  studentId: string,
  context: { classId: string; sessionDate: string },
) {
  await setStudentAttendance(sessionId, studentId, 'present', context);
}

export async function setStudentAttendance(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus,
  context?: { classId: string; sessionDate: string },
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendance');

  if (!isOnline()) {
    if (!context) throwServiceError('offlineAttendanceContextRequired');
    await enqueueAttendanceMark({
      workspaceId: workspace.id,
      sessionId,
      classId: context.classId,
      sessionDate: context.sessionDate,
      studentId,
      status,
    });
    return;
  }

  try {
    await persistStudentAttendance(
      workspace.id,
      sessionId,
      context?.classId ?? '',
      context?.sessionDate ?? '',
      studentId,
      status,
    );
  } catch (error) {
    if (!context || !isLikelyNetworkError(error)) {
      throw error instanceof Error ? error : new Error('Could not update attendance.');
    }
    await enqueueAttendanceMark({
      workspaceId: workspace.id,
      sessionId,
      classId: context.classId,
      sessionDate: context.sessionDate,
      studentId,
      status,
    });
  }
}

export async function cycleStudentAttendance(
  sessionId: string,
  studentId: string,
  current: AttendanceStatus,
  context?: { classId: string; sessionDate: string },
) {
  const next = nextStatus(current);
  await setStudentAttendance(sessionId, studentId, next, context);
  return next;
}

export async function markAllPresent(
  sessionId: string,
  studentIds: string[],
  context?: { classId: string; sessionDate: string },
) {
  if (studentIds.length === 0) return;

  if (!isOnline()) {
    const workspace = await getCurrentWorkspace();
    if (!workspace) throwServiceError('workspaceRequiredAttendance');
    if (!context) throwServiceError('offlineAttendanceContextRequired');
    for (const studentId of studentIds) {
      await enqueueAttendanceMark({
        workspaceId: workspace.id,
        sessionId,
        classId: context.classId,
        sessionDate: context.sessionDate,
        studentId,
        status: 'present',
      });
    }
    return;
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendance');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const rows = studentIds.map((studentId) => ({
    workspace_id: workspace.id,
    session_id: sessionId,
    student_id: studentId,
    status: 'present' as DbAttendanceStatus,
    marked_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase.from('attendance_marks').upsert(rows, { onConflict: 'session_id,student_id' });
    if (error) throw error;
  } catch (error) {
    if (!context || !isLikelyNetworkError(error)) {
      throw error instanceof Error ? error : new Error('Could not mark all present.');
    }
    for (const studentId of studentIds) {
      await enqueueAttendanceMark({
        workspaceId: workspace.id,
        sessionId,
        classId: context.classId,
        sessionDate: context.sessionDate,
        studentId,
        status: 'present',
      });
    }
  }
}

export async function saveAttendanceSession(sessionId: string, classId: string, sessionDate: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendance');

  await syncOfflineAttendanceForSession(sessionId, classId, sessionDate);

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { error } = await supabase
    .from('attendance_sessions')
    .update({ status: 'saved' })
    .eq('workspace_id', workspace.id)
    .eq('id', sessionId);

  if (error) throw new Error(error.message);
}

function percentFromMarks(marks: { status: DbAttendanceStatus }[]) {
  if (marks.length === 0) return 0;
  const attended = marks.filter((mark) => mark.status === 'present' || mark.status === 'late').length;
  return Math.round((attended / marks.length) * 100);
}

export async function getClassAttendanceAverages(classIds: string[]) {
  if (classIds.length === 0) return new Map<string, number>();

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, number>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, number>();

  const { data: sessions, error: sessionsError } = await supabase
    .from('attendance_sessions')
    .select('id, class_id')
    .eq('workspace_id', workspace.id)
    .in('class_id', classIds);

  if (sessionsError) throw new Error(sessionsError.message);

  const sessionIds = (sessions ?? []).map((row) => row.id);
  if (sessionIds.length === 0) return new Map<string, number>();

  const sessionClass = new Map((sessions ?? []).map((row) => [row.id, row.class_id as string]));

  const { data: marks, error: marksError } = await supabase
    .from('attendance_marks')
    .select('session_id, status')
    .eq('workspace_id', workspace.id)
    .in('session_id', sessionIds);

  if (marksError) throw new Error(marksError.message);

  const marksByClass = new Map<string, { status: DbAttendanceStatus }[]>();
  for (const mark of marks ?? []) {
    const classId = sessionClass.get(mark.session_id);
    if (!classId) continue;
    const bucket = marksByClass.get(classId) ?? [];
    bucket.push({ status: mark.status as DbAttendanceStatus });
    marksByClass.set(classId, bucket);
  }

  const averages = new Map<string, number>();
  for (const classId of classIds) {
    averages.set(classId, percentFromMarks(marksByClass.get(classId) ?? []));
  }
  return averages;
}

export async function getStudentAttendancePercents(studentIds: string[]) {
  if (studentIds.length === 0) return new Map<string, number>();

  const workspace = await getCurrentWorkspace();
  if (!workspace) return new Map<string, number>();

  const supabase = getSupabase();
  if (!supabase) return new Map<string, number>();

  const { data, error } = await supabase
    .from('attendance_marks')
    .select('student_id, status')
    .eq('workspace_id', workspace.id)
    .in('student_id', studentIds);

  if (error) throw new Error(error.message);

  const marksByStudent = new Map<string, { status: DbAttendanceStatus }[]>();
  for (const row of data ?? []) {
    const bucket = marksByStudent.get(row.student_id) ?? [];
    bucket.push({ status: row.status as DbAttendanceStatus });
    marksByStudent.set(row.student_id, bucket);
  }

  const percents = new Map<string, number>();
  for (const studentId of studentIds) {
    percents.set(studentId, percentFromMarks(marksByStudent.get(studentId) ?? []));
  }
  return percents;
}

export function getAttendanceTrend(percent: number): 'excellent' | 'watch' | 'risk' {
  if (percent >= 85) return 'excellent';
  if (percent >= 70) return 'watch';
  return 'risk';
}

function formatClassLabel(subject: string, grade: number) {
  return `${subject} G${grade}`;
}

function summarizeSessionMarks(session: AttendanceSessionRow, marks: { status: DbAttendanceStatus }[]): AttendanceSessionSummary {
  const presentCount = marks.filter((mark) => mark.status === 'present').length;
  const lateCount = marks.filter((mark) => mark.status === 'late').length;
  const absentCount = marks.filter((mark) => mark.status === 'absent').length;

  return {
    id: session.id,
    sessionDate: session.session_date,
    displayDate: formatDisplayDate(session.session_date),
    status: session.status,
    presentCount,
    lateCount,
    absentCount,
    markedCount: marks.length,
  };
}

export async function listClassAttendanceSessions(classId: string, limit = 40) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendanceHistory');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data: sessions, error: sessionsError } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('class_id', classId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (sessionsError) throw new Error(sessionsError.message);

  const rows = (sessions ?? []) as AttendanceSessionRow[];
  if (rows.length === 0) return [];

  const sessionIds = rows.map((row) => row.id);
  const { data: marks, error: marksError } = await supabase
    .from('attendance_marks')
    .select('session_id, status')
    .eq('workspace_id', workspace.id)
    .in('session_id', sessionIds);

  if (marksError) throw new Error(marksError.message);

  const marksBySession = new Map<string, { status: DbAttendanceStatus }[]>();
  for (const mark of marks ?? []) {
    const bucket = marksBySession.get(mark.session_id) ?? [];
    bucket.push({ status: mark.status as DbAttendanceStatus });
    marksBySession.set(mark.session_id, bucket);
  }

  return rows.map((session) => summarizeSessionMarks(session, marksBySession.get(session.id) ?? []));
}

export async function listStudentAttendanceHistory(studentId: string, limit = 40) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceRequiredAttendanceHistory');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('attendance_marks')
    .select('id, status, session_id, attendance_sessions(session_date, class_id, classes(subject, grade))')
    .eq('workspace_id', workspace.id)
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const session = unwrapRelation(
        row.attendance_sessions as
          | { session_date: string; class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }
          | { session_date: string; class_id: string; classes: { subject: string; grade: number } | { subject: string; grade: number }[] | null }[]
          | null,
      );
      const classInfo = session ? unwrapRelation(session.classes) : null;
      if (!session || !classInfo) return null;

      return {
        id: row.id as string,
        sessionId: row.session_id as string,
        sessionDate: session.session_date,
        displayDate: formatDisplayDate(session.session_date),
        classId: session.class_id,
        classLabel: formatClassLabel(classInfo.subject, classInfo.grade),
        status: row.status as Exclude<AttendanceStatus, 'unmarked'>,
      } satisfies StudentAttendanceHistoryEntry;
    })
    .filter((entry): entry is StudentAttendanceHistoryEntry => entry !== null);
}
