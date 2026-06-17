-- Phase 2b: Certification foundation for academy and institute workspaces

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  certificate_type text not null
    check (certificate_type in ('completion', 'achievement')),
  title text not null,
  serial_no text not null,
  issued_on date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  unique (workspace_id, serial_no)
);

create index if not exists certificates_workspace_student_idx
  on public.certificates (workspace_id, student_id, issued_on desc);

alter table public.certificates enable row level security;

create policy "Members can manage certificates" on public.certificates
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
