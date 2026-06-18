-- Sprint 6: Branches, halls, and class hall references

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.halls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  capacity integer check (capacity is null or capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id, name)
);

create index if not exists halls_workspace_idx on public.halls (workspace_id);
create index if not exists halls_branch_idx on public.halls (branch_id);
create index if not exists branches_workspace_idx on public.branches (workspace_id);

alter table public.classes
  add column if not exists hall_id uuid references public.halls(id) on delete set null;

create index if not exists classes_hall_idx on public.classes (hall_id);

alter table public.branches enable row level security;
alter table public.halls enable row level security;

create policy "Members can manage branches" on public.branches
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage halls" on public.halls
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Backfill a default branch and halls from existing class hall text
insert into public.branches (workspace_id, name)
select w.id, 'Main branch'
from public.workspaces w
where not exists (
  select 1 from public.branches b where b.workspace_id = w.id
);

insert into public.halls (workspace_id, branch_id, name)
select distinct
  c.workspace_id,
  b.id,
  trim(c.hall)
from public.classes c
join public.branches b on b.workspace_id = c.workspace_id and b.name = 'Main branch'
where c.hall is not null
  and trim(c.hall) <> ''
  and not exists (
    select 1
    from public.halls h
    where h.branch_id = b.id
      and lower(h.name) = lower(trim(c.hall))
  );

update public.classes c
set hall_id = h.id
from public.halls h
join public.branches b on b.id = h.branch_id
where c.workspace_id = h.workspace_id
  and c.hall_id is null
  and c.hall is not null
  and lower(trim(c.hall)) = lower(h.name)
  and b.name = 'Main branch';

insert into public.halls (workspace_id, branch_id, name)
select b.workspace_id, b.id, 'Main hall'
from public.branches b
where b.name = 'Main branch'
  and not exists (
    select 1 from public.halls h where h.branch_id = b.id
  );
