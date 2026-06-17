import { getCurrentWorkspace } from '@/features/auth/authService';
import { CertificateRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type CertificateType = 'completion' | 'achievement';

export type StudentCertificate = {
  id: string;
  certificateType: CertificateType;
  title: string;
  serialNo: string;
  issuedOn: string;
  note: string | null;
};

export type IssueCertificateInput = {
  studentId: string;
  certificateType: CertificateType;
  title: string;
  note?: string;
  issuedOn?: string;
};

function mapCertificateRow(row: CertificateRow): StudentCertificate {
  return {
    id: row.id,
    certificateType: row.certificate_type as CertificateType,
    title: row.title,
    serialNo: row.serial_no,
    issuedOn: row.issued_on,
    note: row.note,
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

async function generateCertificateSerialNo(workspaceId: string) {
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

  return `CERT-${String(max + 1).padStart(4, '0')}`;
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

  const serialNo = await generateCertificateSerialNo(workspace.id);

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
