import { getCurrentWorkspace } from '@/features/auth/authService';
import { getClassAttendanceAverages } from '@/features/attendance/attendanceService';
import { getClassCollectionPercents } from '@/features/fees/feeService';
import { getEnrollmentCountsByClass } from '@/features/enrollment/enrollmentService';
import { ClassRow, Medium } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { ScheduleState, TuitionClass } from './models';

export type ClassFormInput = {
  subject: string;
  grade: number;
  medium: Medium;
  hall?: string;
  weekday: string;
  startTime: string;
  endTime: string;
  monthlyFee: number;
};

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
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Use a valid time, for example 10:30 AM or 15:30.');
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  }

  throw new Error('Use time format like 10:30 AM or 15:30.');
}

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
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (currentMinutes < startMinutes) return 'upcoming';
  if (currentMinutes > endMinutes) return 'completed';
  return 'inProgress';
}

function mapClassRow(row: ClassRow, enrolledCount = 0, attendanceAverage = 0, collectionPercent = 0): TuitionClass {
  return {
    id: row.id,
    subject: row.subject,
    grade: row.grade,
    medium: row.medium,
    hall: row.hall ?? 'Hall not set',
    day: row.weekday,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    monthlyFee: row.monthly_fee,
    capacity: 40,
    enrolledCount,
    attendanceAverage,
    collectionPercent,
    state: getScheduleState(row),
  };
}

export async function listClasses() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding classes.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('weekday', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ClassRow[];
  const classIds = rows.map((row) => row.id);
  const [counts, attendanceAverages, collectionPercents] = await Promise.all([
    getEnrollmentCountsByClass(classIds),
    getClassAttendanceAverages(classIds),
    getClassCollectionPercents(classIds),
  ]);
  return rows.map((row) =>
    mapClassRow(
      row,
      counts.get(row.id) ?? 0,
      attendanceAverages.get(row.id) ?? 0,
      collectionPercents.get(row.id) ?? 0,
    ),
  );
}

export async function getClassById(classId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing classes.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('id', classId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const [counts, attendanceAverages, collectionPercents] = await Promise.all([
    getEnrollmentCountsByClass([data.id]),
    getClassAttendanceAverages([data.id]),
    getClassCollectionPercents([data.id]),
  ]);
  return mapClassRow(
    data as ClassRow,
    counts.get(data.id) ?? 0,
    attendanceAverages.get(data.id) ?? 0,
    collectionPercents.get(data.id) ?? 0,
  );
}

export async function createClass(input: ClassFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding classes.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const subject = requireText(input.subject, 'Subject is required.');
  const weekday = requireText(input.weekday, 'Class day is required.');
  const startTime = parseTimeToDb(input.startTime, 'Start time is required.');
  const endTime = parseTimeToDb(input.endTime, 'End time is required.');

  const { data, error } = await supabase
    .from('classes')
    .insert({
      workspace_id: workspace.id,
      subject,
      grade: input.grade,
      medium: input.medium,
      hall: input.hall?.trim() || null,
      weekday,
      start_time: startTime,
      end_time: endTime,
      monthly_fee: Math.max(0, Math.round(input.monthlyFee || 0)),
      active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapClassRow(data as ClassRow);
}
