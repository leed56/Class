import { FeeStatus } from '@/lib/database.types';
import { throwServiceError } from '@/i18n/serviceErrors';
import { getSupabase } from '@/lib/supabase';

import { getParentSession } from './parentAuthService';

export type ParentStudentOverview = {
  studentId: string;
  studentName: string;
  grade: number;
  medium: string;
  workspaceName: string;
  attendancePercent: number;
  outstandingAmount: number;
  paidAmount: number;
  feeStatus: FeeStatus;
};

export type ParentTimelineReceipt = {
  id: string;
  type: 'receipt';
  title: string;
  subtitle: string;
  amount: number;
  occurredOn: string;
  method: string;
};

export type ParentTimelineCertificate = {
  id: string;
  type: 'certificate';
  title: string;
  subtitle: string;
  occurredOn: string;
  certificateType: string;
  revoked: boolean;
};

export type ParentTimelineItem = ParentTimelineReceipt | ParentTimelineCertificate;

function requireSessionToken(token?: string) {
  if (token) return token;
  throwServiceError('parentSessionExpired');
}

export async function getParentStudentOverview(studentId: string, sessionToken?: string) {
  const session = sessionToken ? { token: sessionToken } : await getParentSession();
  const token = requireSessionToken(session?.token);

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('get_parent_student_overview', {
    session_id: token,
    target_student_id: studentId,
  });
  if (error) throw new Error(error.message);

  const row = data as Record<string, unknown>;
  return {
    studentId: String(row.studentId),
    studentName: String(row.studentName),
    grade: Number(row.grade ?? 0),
    medium: String(row.medium ?? ''),
    workspaceName: String(row.workspaceName ?? ''),
    attendancePercent: Number(row.attendancePercent ?? 0),
    outstandingAmount: Number(row.outstandingAmount ?? 0),
    paidAmount: Number(row.paidAmount ?? 0),
    feeStatus: String(row.feeStatus ?? 'pending') as FeeStatus,
  } satisfies ParentStudentOverview;
}

export async function getParentStudentTimeline(studentId: string, sessionToken?: string) {
  const session = sessionToken ? { token: sessionToken } : await getParentSession();
  const token = requireSessionToken(session?.token);

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('get_parent_student_timeline', {
    session_id: token,
    target_student_id: studentId,
  });
  if (error) throw new Error(error.message);

  const row = data as { receipts?: unknown; certificates?: unknown };
  const receipts = Array.isArray(row.receipts)
    ? row.receipts.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          id: String(entry.id),
          type: 'receipt' as const,
          title: String(entry.title),
          subtitle: String(entry.subtitle),
          amount: Number(entry.amount ?? 0),
          occurredOn: String(entry.occurredOn),
          method: String(entry.method ?? 'cash'),
        };
      })
    : [];

  const certificates = Array.isArray(row.certificates)
    ? row.certificates.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          id: String(entry.id),
          type: 'certificate' as const,
          title: String(entry.title),
          subtitle: String(entry.subtitle),
          occurredOn: String(entry.occurredOn),
          certificateType: String(entry.certificateType ?? 'completion'),
          revoked: Boolean(entry.revoked),
        };
      })
    : [];

  const timeline: ParentTimelineItem[] = [...receipts, ...certificates].sort((a, b) => {
    return new Date(b.occurredOn).getTime() - new Date(a.occurredOn).getTime();
  });

  return { receipts, certificates, timeline };
}

export function formatParentTimelineDate(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}
