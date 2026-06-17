-- Phase 1.5: Academy catalog, admission fees, payment allocations, institute settings

alter table public.workspaces
  add column if not exists institute_type text not null default 'solo'
    check (institute_type in ('solo', 'academy', 'institute')),
  add column if not exists admission_fee_lkr integer not null default 0,
  add column if not exists pro_rata_enabled boolean not null default true;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  syllabus text not null default 'local'
    check (syllabus in ('local', 'cambridge', 'edexcel', 'other')),
  grade integer not null check (grade between 1 and 13),
  medium text not null check (medium in ('English', 'Sinhala', 'Tamil')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null default 'Main batch',
  intake_year integer,
  exam_year integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.offerings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  offering_type text not null default 'theory'
    check (offering_type in ('theory', 'revision', 'paper', 'extra', 'online')),
  name text not null,
  default_monthly_fee integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.classes
  add column if not exists offering_id uuid references public.offerings(id) on delete set null;

alter table public.fee_invoices
  add column if not exists invoice_type text not null default 'monthly'
    check (invoice_type in ('monthly', 'admission', 'material', 'exam')),
  add column if not exists description text;

alter table public.fee_invoices
  alter column class_id drop not null;

alter table public.fee_invoices
  alter column month drop not null;

alter table public.fee_invoices
  drop constraint if exists fee_invoices_student_id_class_id_month_key;

create unique index if not exists fee_invoices_monthly_unique
  on public.fee_invoices (student_id, class_id, month)
  where invoice_type = 'monthly' and class_id is not null and month is not null;

create unique index if not exists fee_invoices_admission_unique
  on public.fee_invoices (student_id, workspace_id)
  where invoice_type = 'admission';

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

alter table public.payments
  alter column invoice_id drop not null;

-- Backfill payment allocations for existing payments
insert into public.payment_allocations (workspace_id, payment_id, invoice_id, amount)
select p.workspace_id, p.id, p.invoice_id, p.amount
from public.payments p
where p.invoice_id is not null
on conflict (payment_id, invoice_id) do nothing;

-- Backfill catalog for existing classes (solo-style: 1 program → 1 batch → 1 offering per class)
insert into public.programs (workspace_id, name, syllabus, grade, medium)
select distinct
  c.workspace_id,
  c.subject || ' Grade ' || c.grade::text,
  'local',
  c.grade,
  c.medium
from public.classes c
where c.offering_id is null
  and not exists (
    select 1 from public.programs p
    where p.workspace_id = c.workspace_id
      and p.name = c.subject || ' Grade ' || c.grade::text
      and p.grade = c.grade
      and p.medium = c.medium
  );

insert into public.batches (workspace_id, program_id, name, intake_year)
select
  c.workspace_id,
  p.id,
  'Main batch',
  extract(year from c.created_at)::integer
from public.classes c
join public.programs p
  on p.workspace_id = c.workspace_id
 and p.name = c.subject || ' Grade ' || c.grade::text
 and p.grade = c.grade
 and p.medium = c.medium
where c.offering_id is null
  and not exists (
    select 1 from public.batches b
    where b.program_id = p.id and b.name = 'Main batch'
  );

insert into public.offerings (workspace_id, batch_id, offering_type, name, default_monthly_fee)
select
  c.workspace_id,
  b.id,
  'theory',
  c.subject || ' — Theory',
  c.monthly_fee
from public.classes c
join public.programs p
  on p.workspace_id = c.workspace_id
 and p.name = c.subject || ' Grade ' || c.grade::text
 and p.grade = c.grade
 and p.medium = c.medium
join public.batches b on b.program_id = p.id and b.name = 'Main batch'
where c.offering_id is null
  and not exists (
    select 1 from public.offerings o
    where o.batch_id = b.id and o.name = c.subject || ' — Theory'
  );

update public.classes c
set offering_id = o.id
from public.offerings o
join public.batches b on b.id = o.batch_id
join public.programs p on p.id = b.program_id
where c.offering_id is null
  and c.workspace_id = p.workspace_id
  and p.name = c.subject || ' Grade ' || c.grade::text
  and p.grade = c.grade
  and p.medium = c.medium
  and o.name = c.subject || ' — Theory';

alter table public.programs enable row level security;
alter table public.batches enable row level security;
alter table public.offerings enable row level security;
alter table public.payment_allocations enable row level security;

create policy "Members can manage programs" on public.programs
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage batches" on public.batches
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage offerings" on public.offerings
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage payment allocations" on public.payment_allocations
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
