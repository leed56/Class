import { getCurrentWorkspace } from '@/features/auth/authService';
import { MessageDeliveryRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type MessageType =
  | 'absence_alert'
  | 'fee_reminder'
  | 'certificate'
  | 'receipt'
  | 'announcement'
  | 'custom';

export type DeliveryStatus = 'draft' | 'sent' | 'failed' | 'skipped';
export type DeliveryChannel = 'whatsapp' | 'sms';

export type MessageDelivery = {
  id: string;
  studentId: string | null;
  sessionId: string | null;
  parentPhone: string;
  messageType: MessageType;
  channel: DeliveryChannel;
  body: string;
  status: DeliveryStatus;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type CreateMessageDeliveryInput = {
  studentId?: string | null;
  sessionId?: string | null;
  parentPhone: string;
  messageType: MessageType;
  channel?: DeliveryChannel;
  body: string;
  status?: DeliveryStatus;
  errorMessage?: string | null;
};

function mapDeliveryRow(row: MessageDeliveryRow): MessageDelivery {
  return {
    id: row.id,
    studentId: row.student_id,
    sessionId: row.session_id,
    parentPhone: row.parent_phone,
    messageType: row.message_type as MessageType,
    channel: row.channel as DeliveryChannel,
    body: row.body,
    status: row.status as DeliveryStatus,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

export function applyMessageTemplate(
  template: string,
  values: Record<string, string>,
) {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}

export function getDefaultAbsenceAlertTemplate() {
  return `Dear parent,

{{student_name}} was marked absent from {{class_name}} on {{session_date}} at {{workspace_name}}.

Please contact the teacher if there is a concern. Thank you.`;
}

export async function createMessageDelivery(input: CreateMessageDeliveryInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before logging messages.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('message_deliveries')
    .insert({
      workspace_id: workspace.id,
      student_id: input.studentId ?? null,
      session_id: input.sessionId ?? null,
      parent_phone: input.parentPhone.trim(),
      message_type: input.messageType,
      channel: input.channel ?? 'whatsapp',
      body: input.body.trim(),
      status: input.status ?? 'draft',
      error_message: input.errorMessage ?? null,
      sent_at: input.status === 'sent' ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapDeliveryRow(data as MessageDeliveryRow);
}

export async function updateMessageDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  errorMessage?: string | null,
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before updating messages.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('message_deliveries')
    .update({
      status,
      error_message: errorMessage ?? null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
    .eq('workspace_id', workspace.id)
    .eq('id', deliveryId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapDeliveryRow(data as MessageDeliveryRow);
}

export async function listMessageDeliveries(limit = 50) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing message history.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('message_deliveries')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapDeliveryRow(row as MessageDeliveryRow));
}

export async function hasAbsenceAlertForSessionStudent(sessionId: string, studentId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('message_deliveries')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .eq('message_type', 'absence_alert')
    .in('status', ['sent', 'draft'])
    .limit(1);

  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export async function getCommunicationStats() {
  const deliveries = await listMessageDeliveries(100);
  const sent = deliveries.filter((item) => item.status === 'sent').length;
  const failed = deliveries.filter((item) => item.status === 'failed').length;
  const skipped = deliveries.filter((item) => item.status === 'skipped').length;
  return { total: deliveries.length, sent, failed, skipped };
}
