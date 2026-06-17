const QR_PREFIX = 'CF1';

export type StudentQrPayload = {
  workspaceId: string;
  studentId: string;
};

export function buildStudentQrPayload(input: StudentQrPayload) {
  return `${QR_PREFIX}|${input.workspaceId}|${input.studentId}`;
}

export function parseStudentQrPayload(raw: string): StudentQrPayload | null {
  const value = raw.trim();
  if (!value.startsWith(`${QR_PREFIX}|`)) return null;

  const parts = value.split('|');
  if (parts.length !== 3) return null;

  const workspaceId = parts[1]?.trim();
  const studentId = parts[2]?.trim();
  if (!workspaceId || !studentId) return null;

  return { workspaceId, studentId };
}
