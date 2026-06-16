-- ClassFlow Supabase schema
-- Multi-tenant, teacher-first MVP for Sri Lankan tuition classes.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'institute')),
  default_language text not null default 'en' check (default_language in ('en', 'si', 'ta')),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'teacher', 'admin')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  grade integer not null check (grade between 1 and 13),
  medium text not null check (medium in ('English', 'Sinhala', 'Tamil')),
  school text,
  parent_name text,
  parent_phone text not null,
  consent_captured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  subject text not null,
  grade integer not null check (grade between 1 and 13),
  medium text not null check (medium in ('English', 'Sinhala', 'Tamil')),
  hall text,
  weekday text not null,
  start_time time not null,
  end_time time not null,
  monthly_fee integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  session_date date not null,
  status text not null default 'draft' check (status in ('draft', 'saved', 'synced')),
  created_at timestamptz not null default now(),
  unique (class_id, session_date)
);

create table if not exists public.attendance_marks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent')),
  note text,
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table if not exists public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  month text not null,
  monthly_fee integer not null,
  paid_amount integer not null default 0,
  status text not null default 'pending' check (status in ('paid', 'partial', 'pending', 'overdue')),
  due_date date,
  created_at timestamptz not null default now(),
  unique (student_id, class_id, month)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount integer not null check (amount > 0),
  method text not null default 'cash' check (method in ('cash', 'bank', 'online')),
  receipt_no text not null,
  paid_at timestamptz not null default now(),
  note text,
  unique (workspace_id, receipt_no)
);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_marks enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Members can read own workspaces" on public.workspaces;
drop policy if exists "Owners can read own workspaces" on public.workspaces;
drop policy if exists "Owners can create workspaces" on public.workspaces;
drop policy if exists "Members can read workspace members" on public.workspace_members;
drop policy if exists "Owners can add themselves as member" on public.workspace_members;

create policy "Members can read own workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));

create policy "Owners can read own workspaces" on public.workspaces
  for select using (owner_id = auth.uid());

create policy "Owners can create workspaces" on public.workspaces
  for insert with check (owner_id = auth.uid());

create policy "Members can read workspace members" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

create policy "Owners can add themselves as member" on public.workspace_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.owner_id = auth.uid()
    )
  );

create policy "Members can manage students" on public.students
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "Members can manage classes" on public.classes
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "Members can manage enrollments" on public.class_enrollments
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "Members can manage attendance sessions" on public.attendance_sessions
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "Members can manage attendance marks" on public.attendance_marks
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "Members can manage fee invoices" on public.fee_invoices
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "Members can manage payments" on public.payments
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
