import AsyncStorage from '@react-native-async-storage/async-storage';

import { AttendanceStatus } from '@/features/attendance/models';

const QUEUE_KEY = 'classflow:attendance_offline_queue';

export type OfflineAttendanceOperation = {
  id: string;
  workspaceId: string;
  sessionId: string;
  classId: string;
  sessionDate: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
};

type OfflineAttendanceQueue = {
  items: OfflineAttendanceOperation[];
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readQueue(): Promise<OfflineAttendanceQueue> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(raw) as OfflineAttendanceQueue;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

async function writeQueue(queue: OfflineAttendanceQueue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueAttendanceMark(input: Omit<OfflineAttendanceOperation, 'id' | 'markedAt'> & { markedAt?: string }) {
  const queue = await readQueue();
  const next: OfflineAttendanceOperation = {
    ...input,
    id: createId(),
    markedAt: input.markedAt ?? new Date().toISOString(),
  };

  const existingIndex = queue.items.findIndex(
    (item) =>
      item.workspaceId === next.workspaceId &&
      item.sessionId === next.sessionId &&
      item.studentId === next.studentId,
  );

  if (existingIndex >= 0) {
    queue.items[existingIndex] = next;
  } else {
    queue.items.push(next);
  }

  await writeQueue(queue);
  return next;
}

export async function listPendingAttendanceMarks(workspaceId: string, sessionId?: string) {
  const queue = await readQueue();
  return queue.items.filter((item) => {
    if (item.workspaceId !== workspaceId) return false;
    if (sessionId && item.sessionId !== sessionId) return false;
    return true;
  });
}

export async function countPendingAttendanceMarks(workspaceId: string, sessionId?: string) {
  const items = await listPendingAttendanceMarks(workspaceId, sessionId);
  return items.length;
}

export async function removeAttendanceMarks(ids: string[]) {
  if (ids.length === 0) return;
  const queue = await readQueue();
  const idSet = new Set(ids);
  queue.items = queue.items.filter((item) => !idSet.has(item.id));
  await writeQueue(queue);
}

export async function clearAttendanceMarksForSession(workspaceId: string, sessionId: string) {
  const queue = await readQueue();
  queue.items = queue.items.filter((item) => !(item.workspaceId === workspaceId && item.sessionId === sessionId));
  await writeQueue(queue);
}

export function mergePendingMarks<T extends { id: string; attendanceStatus: AttendanceStatus }>(
  students: T[],
  pending: OfflineAttendanceOperation[],
): T[] {
  if (pending.length === 0) return students;
  const pendingByStudent = new Map(pending.map((item) => [item.studentId, item.status]));
  return students.map((student) => {
    const pendingStatus = pendingByStudent.get(student.id);
    if (!pendingStatus) return student;
    return { ...student, attendanceStatus: pendingStatus };
  });
}
