-- Sprint 1: Certificate document pipeline (templates, revoke, reprint history)

alter table public.workspaces
  add column if not exists certificate_signatory_name text not null default '',
  add column if not exists certificate_signatory_title text not null default 'Director',
  add column if not exists certificate_completion_body text not null default
    'This is to certify that {{student_name}} has successfully completed {{title}} at {{workspace_name}}.',
  add column if not exists certificate_achievement_body text not null default
    'This is to certify that {{student_name}} has demonstrated outstanding achievement in {{title}} at {{workspace_name}}.',
  add column if not exists certificate_footer_note text not null default 'Issued via ClassFlow';

alter table public.certificates
  add column if not exists revoked_at timestamptz,
  add column if not exists revoke_reason text;

create table if not exists public.certificate_prints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  printed_by uuid references auth.users(id) on delete set null,
  action text not null check (action in ('download', 'share', 'reprint')),
  created_at timestamptz not null default now()
);

create index if not exists certificate_prints_certificate_idx
  on public.certificate_prints (certificate_id, created_at desc);

alter table public.certificate_prints enable row level security;

create policy "Members can manage certificate prints" on public.certificate_prints
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
