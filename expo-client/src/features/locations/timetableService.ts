import { getCurrentWorkspace } from '@/features/auth/authService';
import { ClassRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

import { ScheduleConflict } from './models';
import { getHallLabel } from './branchService';

function parseDisplayTimeToMinutes(value: string) {
  const trimmed = value.trim();
  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2]);
    const period = twelveHour[3].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  }

  return null;
}

function parseDbTimeToMinutes(value: string) {
  const [hourText, minuteText] = value.split(':');
  return Number(hourText) * 60 + Number(minuteText ?? 0);
}

function formatTime(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = minuteText ?? '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export async function findHallScheduleConflicts(input: {
  hallId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  excludeClassId?: string;
}): Promise<ScheduleConflict[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace || !input.hallId) return [];

  const startMinutes = parseDisplayTimeToMinutes(input.startTime);
  const endMinutes = parseDisplayTimeToMinutes(input.endTime);
  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .eq('hall_id', input.hallId)
    .eq('weekday', input.weekday);

  if (error) throw new Error(error.message);

  const hallLabel = (await getHallLabel(input.hallId)) ?? 'Hall';
  const conflicts: ScheduleConflict[] = [];

  for (const row of (data ?? []) as ClassRow[]) {
    if (input.excludeClassId && row.id === input.excludeClassId) continue;

    const otherStart = parseDbTimeToMinutes(row.start_time);
    const otherEnd = parseDbTimeToMinutes(row.end_time);
    if (!rangesOverlap(startMinutes, endMinutes, otherStart, otherEnd)) continue;

    conflicts.push({
      classId: row.id,
      subject: row.subject,
      grade: row.grade,
      weekday: row.weekday,
      startTime: formatTime(row.start_time),
      endTime: formatTime(row.end_time),
      hallLabel,
    });
  }

  return conflicts;
}

export async function listWorkspaceScheduleConflicts() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .not('hall_id', 'is', null)
    .order('weekday')
    .order('start_time');

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ClassRow[];
  const grouped = new Map<string, ClassRow[]>();
  for (const row of rows) {
    if (!row.hall_id) continue;
    const key = `${row.hall_id}|${row.weekday}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }

  const conflicts: ScheduleConflict[] = [];
  for (const bucket of grouped.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        const a = bucket[i];
        const b = bucket[j];
        const aStart = parseDbTimeToMinutes(a.start_time);
        const aEnd = parseDbTimeToMinutes(a.end_time);
        const bStart = parseDbTimeToMinutes(b.start_time);
        const bEnd = parseDbTimeToMinutes(b.end_time);
        if (!rangesOverlap(aStart, aEnd, bStart, bEnd)) continue;

        const hallLabel = a.hall ?? 'Hall';
        conflicts.push({
          classId: b.id,
          subject: b.subject,
          grade: b.grade,
          weekday: b.weekday,
          startTime: formatTime(b.start_time),
          endTime: formatTime(b.end_time),
          hallLabel,
        });
      }
    }
  }

  return conflicts;
}
