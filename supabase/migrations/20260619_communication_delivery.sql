-- Sprint 2: Absence alerts, delivery log, and communication settings

alter table public.workspaces
  add column if not exists absence_alerts_enabled boolean not null default true,
  add column if not exists absence_alert_template text not null default
    'Dear parent,

{{student_name}} was marked absent from {{class_name}} on {{session_date}} at {{workspace_name}}.

Please contact the teacher if there is a concern. Thank you.';

create table if not exists public.message_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  session_id uuid references public.attendance_sessions(id) on delete set null,
  parent_phone text not null,
  message_type text not null
    check (message_type in ('absence_alert', 'fee_reminder', 'certificate', 'receipt', 'announcement', 'custom')),
  channel text not null default 'whatsapp'
    check (channel in ('whatsapp', 'sms')),
  body text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists message_deliveries_workspace_created_idx
  on public.message_deliveries (workspace_id, created_at desc);

create index if not exists message_deliveries_session_student_idx
  on public.message_deliveries (session_id, student_id, message_type);

alter table public.message_deliveries enable row level security;

create policy "Members can manage message deliveries" on public.message_deliveries
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
