-- Sprint 9: Hall rent ledger (teacher slot bookings + rent invoices)

create table if not exists public.hall_bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  hall_id uuid not null references public.halls(id) on delete restrict,
  teacher_user_id uuid not null references auth.users(id) on delete restrict,
  label text,
  weekday text not null,
  start_time time not null,
  end_time time not null,
  monthly_rent_lkr integer not null check (monthly_rent_lkr >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint hall_bookings_time_order check (end_time > start_time)
);

create unique index if not exists hall_bookings_slot_uidx
  on public.hall_bookings (workspace_id, hall_id, weekday, start_time)
  where active = true;

create index if not exists hall_bookings_workspace_idx on public.hall_bookings (workspace_id);
create index if not exists hall_bookings_teacher_idx on public.hall_bookings (teacher_user_id);

create table if not exists public.hall_rent_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null references public.hall_bookings(id) on delete cascade,
  teacher_user_id uuid not null references auth.users(id) on delete restrict,
  month text not null,
  amount integer not null check (amount >= 0),
  paid_amount integer not null default 0 check (paid_amount >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  unique (booking_id, month)
);

create index if not exists hall_rent_invoices_workspace_idx on public.hall_rent_invoices (workspace_id);
create index if not exists hall_rent_invoices_teacher_idx on public.hall_rent_invoices (teacher_user_id);
create index if not exists hall_rent_invoices_month_idx on public.hall_rent_invoices (month);

alter table public.hall_bookings enable row level security;
alter table public.hall_rent_invoices enable row level security;

create policy "Admins manage hall bookings" on public.hall_bookings
  for all using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Teachers read own hall bookings" on public.hall_bookings
  for select using (
    public.is_workspace_member(workspace_id)
    and teacher_user_id = auth.uid()
  );

create policy "Admins manage hall rent invoices" on public.hall_rent_invoices
  for all using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Teachers read own hall rent invoices" on public.hall_rent_invoices
  for select using (
    public.is_workspace_member(workspace_id)
    and teacher_user_id = auth.uid()
  );
