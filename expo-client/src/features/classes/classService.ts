import { getCurrentWorkspace } from '@/features/auth/authService';
import { ClassRow, Medium } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
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

function normalizeTime(value: string, message: string) {
  const trimmed = requireText(value, message);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error('Use time format HH:MM, for example 15:30.');

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Use a valid 24-hour time, for example 15:30.');
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
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

function mapClassRow(row: ClassRow): TuitionClass {
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
    enrolledCount: 0,
    attendanceAverage: 0,
    collectionPercent: 0,
    state: getScheduleState(row),
  };
}

export async function listClasses() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding classes.');

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('weekday', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapClassRow(row as ClassRow));
}

export async function getClassById(classId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing classes.');

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('id', classId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapClassRow(data as ClassRow) : null;
}

export async function createClass(input: ClassFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding classes.');

  const subject = requireText(input.subject, 'Subject is required.');
  const weekday = requireText(input.weekday, 'Class day is required.');
  const startTime = normalizeTime(input.startTime, 'Start time is required.');
  const endTime = normalizeTime(input.endTime, 'End time is required.');

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

export async function updateClass(classId: string, input: ClassFormInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before editing classes.');

  const { data, error } = await supabase
    .from('classes')
    .update({
      subject: requireText(input.subject, 'Subject is required.'),
      grade: input.grade,
      medium: input.medium,
      hall: input.hall?.trim() || null,
      weekday: requireText(input.weekday, 'Class day is required.'),
      start_time: normalizeTime(input.startTime, 'Start time is required.'),
      end_time: normalizeTime(input.endTime, 'End time is required.'),
      monthly_fee: Math.max(0, Math.round(input.monthlyFee || 0)),
    })
    .eq('workspace_id', workspace.id)
    .eq('id', classId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapClassRow(data as ClassRow);
}

export async function archiveClass(classId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before removing classes.');

  const { error } = await supabase
    .from('classes')
    .update({ active: false })
    .eq('workspace_id', workspace.id)
    .eq('id', classId);

  if (error) throw new Error(error.message);
}
