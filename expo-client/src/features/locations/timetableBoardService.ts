import { listClasses } from '@/features/classes/classService';
import { listHalls } from '@/features/locations/branchService';

export type TimetableBoardCell = {
  classId: string;
  subject: string;
  grade: number;
  teacherLabel: string;
  startTime: string;
  endTime: string;
  weekday: string;
};

export type TimetableBoardRow = {
  hallId: string;
  hallLabel: string;
  slots: TimetableBoardCell[];
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export async function buildTimetableBoard(weekday?: string): Promise<{
  weekday: string;
  rows: TimetableBoardRow[];
  conflicts: number;
}> {
  const [classes, halls] = await Promise.all([listClasses(), listHalls()]);
  const activeDay =
    weekday ??
    new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const dayClasses = classes.filter((item) => item.day === activeDay);
  const hallMap = new Map(halls.map((hall) => [hall.id, hall.name]));

  const grouped = new Map<string, TimetableBoardCell[]>();
  for (const item of dayClasses) {
    const hallId = item.hallId ?? 'unassigned';
    const bucket = grouped.get(hallId) ?? [];
    bucket.push({
      classId: item.id,
      subject: item.subject,
      grade: item.grade,
      teacherLabel: item.subject,
      startTime: item.startTime,
      endTime: item.endTime,
      weekday: item.day,
    });
    grouped.set(hallId, bucket);
  }

  const rows: TimetableBoardRow[] = Array.from(grouped.entries())
    .map(([hallId, slots]) => ({
      hallId,
      hallLabel: hallId === 'unassigned' ? 'Hall not set' : hallMap.get(hallId) ?? 'Hall',
      slots: slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .sort((a, b) => a.hallLabel.localeCompare(b.hallLabel));

  let conflicts = 0;
  for (const row of rows) {
    for (let i = 0; i < row.slots.length; i += 1) {
      for (let j = i + 1; j < row.slots.length; j += 1) {
        if (row.slots[i].startTime === row.slots[j].startTime) conflicts += 1;
      }
    }
  }

  return { weekday: activeDay, rows, conflicts };
}

export function listTimetableWeekdays() {
  return [...WEEKDAYS];
}
