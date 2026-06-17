import { getCurrentWorkspace } from '@/features/auth/authService';
import { getStudentAttendancePercents } from '@/features/attendance/attendanceService';
import { getStudentFeeSummaries } from '@/features/fees/feeService';
import { CertificatePrintRow, CertificateRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type CertificateType = 'completion' | 'achievement';
export type CertificatePrintAction = 'download' | 'share' | 'reprint';

export type StudentCertificate = {
  id: string;
  certificateType: CertificateType;
  title: string;
  serialNo: string;
  issuedOn: string;
  note: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
};

export type CertificatePrint = {
  id: string;
  action: CertificatePrintAction;
  createdAt: string;
};

export type CertificateTemplateSettings = {
  signatoryName: string;
  signatoryTitle: string;
  completionBody: string;
  achievementBody: string;
  footerNote: string;
};

export type IssueCertificateInput = {
  studentId: string;
  certificateType: CertificateType;
  title: string;
  note?: string;
  issuedOn?: string;
};

export type IssueBulkCertificatesInput = {
  studentIds: string[];
  certificateType: CertificateType;
  title: string;
  note?: string;
  issuedOn?: string;
};

export type CertificateEligibility = {
  studentId: string;
  attendancePercent: number;
  outstandingAmount: number;
  eligible: boolean;
  blockers: string[];
};

export type IssueBulkCertificatesResult = {
  issued: StudentCertificate[];
  blocked: CertificateEligibility[];
};

function mapCertificateRow(row: CertificateRow): StudentCertificate {
  return {
    id: row.id,
    certificateType: row.certificate_type as CertificateType,
    title: row.title,
    serialNo: row.serial_no,
    issuedOn: row.issued_on,
    note: row.note,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
  };
}

function mapCertificatePrintRow(row: CertificatePrintRow): CertificatePrint {
  return {
    id: row.id,
    action: row.action as CertificatePrintAction,
    createdAt: row.created_at,
  };
}

export function isCertificateRevoked(certificate: Pick<StudentCertificate, 'revokedAt'>) {
  return certificate.revokedAt != null;
}

export function getCertificateTemplateFromWorkspace(
  workspace: {
    name: string;
    certificate_signatory_name?: string;
    certificate_signatory_title?: string;
    certificate_completion_body?: string;
    certificate_achievement_body?: string;
    certificate_footer_note?: string;
  } | null,
): CertificateTemplateSettings & { workspaceName: string } {
  return {
    workspaceName: workspace?.name ?? 'Your workspace',
    signatoryName: workspace?.certificate_signatory_name ?? '',
    signatoryTitle: workspace?.certificate_signatory_title ?? 'Director',
    completionBody:
      workspace?.certificate_completion_body ??
      'This is to certify that {{student_name}} has successfully completed {{title}} at {{workspace_name}}.',
    achievementBody:
      workspace?.certificate_achievement_body ??
      'This is to certify that {{student_name}} has demonstrated outstanding achievement in {{title}} at {{workspace_name}}.',
    footerNote: workspace?.certificate_footer_note ?? 'Issued via ClassFlow',
  };
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCertificateDate(value: string) {
  return formatDate(value);
}

function formatLkr(value: number) {
  return `LKR ${value.toLocaleString('en-LK')}`;
}

function buildEligibility(
  studentId: string,
  attendancePercent: number,
  outstandingAmount: number,
  minAttendanceForCertificate: number,
  requireFeesClearForCertificate: boolean,
): CertificateEligibility {
  const blockers: string[] = [];
  if (attendancePercent < minAttendanceForCertificate) {
    blockers.push(`Attendance ${attendancePercent}% is below required ${minAttendanceForCertificate}%.`);
  }
  if (requireFeesClearForCertificate && outstandingAmount > 0) {
    blockers.push(`Outstanding fees: ${formatLkr(outstandingAmount)}.`);
  }

  return {
    studentId,
    attendancePercent,
    outstandingAmount,
    eligible: blockers.length === 0,
    blockers,
  };
}

export async function getCertificateEligibilityForStudents(studentIds: string[]) {
  if (studentIds.length === 0) return new Map<string, CertificateEligibility>();

  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');
  if (workspace.institute_type === 'solo') {
    throw new Error('Certification is available for academy and institute workspaces.');
  }

  const uniqueIds = [...new Set(studentIds)];
  const [attendancePercents, feeSummaries] = await Promise.all([
    getStudentAttendancePercents(uniqueIds),
    getStudentFeeSummaries(uniqueIds),
  ]);

  const map = new Map<string, CertificateEligibility>();
  for (const studentId of uniqueIds) {
    const attendancePercent = attendancePercents.get(studentId) ?? 0;
    const outstandingAmount = feeSummaries.get(studentId)?.outstandingAmount ?? 0;
    map.set(
      studentId,
      buildEligibility(
        studentId,
        attendancePercent,
        outstandingAmount,
        workspace.min_attendance_for_certificate ?? 75,
        workspace.require_fees_clear_for_certificate ?? true,
      ),
    );
  }
  return map;
}

async function getNextCertificateNumber(workspaceId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('certificates')
    .select('serial_no')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  let max = 0;
  for (const row of data ?? []) {
    const match = row.serial_no.match(/CERT-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  }

  return max + 1;
}

function formatCertificateSerialNo(value: number) {
  return `CERT-${String(value).padStart(4, '0')}`;
}

export async function listStudentCertificates(studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('student_id', studentId)
    .order('issued_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCertificateRow(row as CertificateRow));
}

export async function getStudentCertificateById(studentId: string, certificateId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('student_id', studentId)
    .eq('id', certificateId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCertificateRow(data as CertificateRow);
}

export async function issueCertificate(input: IssueCertificateInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');
  if (workspace.institute_type === 'solo') {
    throw new Error('Certification is available for academy and institute workspaces.');
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const title = input.title.trim();
  if (!title) throw new Error('Certificate title is required.');

  const eligibility = await getCertificateEligibilityForStudents([input.studentId]);
  const studentEligibility = eligibility.get(input.studentId);
  if (!studentEligibility?.eligible) {
    throw new Error(studentEligibility?.blockers[0] ?? 'Student is not eligible for certification.');
  }

  const serialNo = formatCertificateSerialNo(await getNextCertificateNumber(workspace.id));

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      workspace_id: workspace.id,
      student_id: input.studentId,
      certificate_type: input.certificateType,
      title,
      serial_no: serialNo,
      issued_on: input.issuedOn ?? new Date().toISOString().slice(0, 10),
      note: input.note?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapCertificateRow(data as CertificateRow);
}

export async function issueCertificatesBulk(input: IssueBulkCertificatesInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');
  if (workspace.institute_type === 'solo') {
    throw new Error('Certification is available for academy and institute workspaces.');
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const studentIds = [...new Set(input.studentIds)];
  if (studentIds.length === 0) throw new Error('Select at least one student.');

  const title = input.title.trim();
  if (!title) throw new Error('Certificate title is required.');

  const eligibilityMap = await getCertificateEligibilityForStudents(studentIds);
  const blocked = studentIds
    .map((studentId) => eligibilityMap.get(studentId))
    .filter((item): item is CertificateEligibility => !!item && !item.eligible);
  const eligibleIds = studentIds.filter((studentId) => eligibilityMap.get(studentId)?.eligible);
  if (eligibleIds.length === 0) {
    throw new Error(blocked[0]?.blockers[0] ?? 'No eligible students selected for certification.');
  }

  const issuedOn = input.issuedOn ?? new Date().toISOString().slice(0, 10);
  let nextNumber = await getNextCertificateNumber(workspace.id);

  const rows = eligibleIds.map((studentId) => ({
    workspace_id: workspace.id,
    student_id: studentId,
    certificate_type: input.certificateType,
    title,
    serial_no: formatCertificateSerialNo(nextNumber++),
    issued_on: issuedOn,
    note: input.note?.trim() || null,
  }));

  const { data, error } = await supabase.from('certificates').insert(rows).select('*');
  if (error) throw new Error(error.message);
  return {
    issued: (data ?? []).map((row) => mapCertificateRow(row as CertificateRow)),
    blocked,
  } satisfies IssueBulkCertificatesResult;
}

export async function listCertificatePrints(certificateId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('certificate_prints')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('certificate_id', certificateId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCertificatePrintRow(row as CertificatePrintRow));
}

export async function logCertificatePrint(certificateId: string, action: CertificatePrintAction) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('certificate_prints').insert({
    workspace_id: workspace.id,
    certificate_id: certificateId,
    printed_by: user?.id ?? null,
    action,
  });

  if (error) throw new Error(error.message);
}

export async function revokeCertificate(certificateId: string, reason?: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing certificates.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('certificates')
    .update({
      revoked_at: new Date().toISOString(),
      revoke_reason: reason?.trim() || null,
    })
    .eq('workspace_id', workspace.id)
    .eq('id', certificateId)
    .is('revoked_at', null)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Certificate not found or already revoked.');
  return mapCertificateRow(data as CertificateRow);
}
