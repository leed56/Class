-- Platform admin + customer invite provisioning

create table if not exists public.platform_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  email text,
  institute_type text not null check (institute_type in ('solo', 'academy', 'institute')),
  academy_sector text,
  workspace_name_hint text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists platform_invites_token_idx on public.platform_invites (token);
create index if not exists platform_invites_expires_idx on public.platform_invites (expires_at);

alter table public.platform_admins enable row level security;
alter table public.platform_invites enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where lower(pa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.list_platform_workspaces()
returns table (
  workspace_id uuid,
  workspace_name text,
  institute_type text,
  academy_sector text,
  owner_email text,
  member_count bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin access required';
  end if;

  return query
  select
    w.id,
    w.name,
    w.institute_type,
    w.academy_sector,
    coalesce(u.email::text, '') as owner_email,
    (
      select count(*)::bigint
      from public.workspace_members wm
      where wm.workspace_id = w.id
    ) as member_count,
    w.created_at
  from public.workspaces w
  left join auth.users u on u.id = w.owner_id
  order by w.created_at desc;
end;
$$;

create or replace function public.create_platform_invite(
  p_institute_type text,
  p_academy_sector text default null,
  p_workspace_name_hint text default null,
  p_email text default null,
  p_note text default null,
  p_expires_days integer default 14
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_token text;
  invite_row public.platform_invites%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin access required';
  end if;

  if p_institute_type not in ('solo', 'academy', 'institute') then
    raise exception 'Invalid institute type';
  end if;

  invite_token := encode(gen_random_bytes(9), 'hex');

  insert into public.platform_invites (
    token,
    email,
    institute_type,
    academy_sector,
    workspace_name_hint,
    note,
    created_by,
    expires_at
  )
  values (
    invite_token,
    nullif(lower(trim(coalesce(p_email, ''))), ''),
    p_institute_type,
    nullif(trim(coalesce(p_academy_sector, '')), ''),
    nullif(trim(coalesce(p_workspace_name_hint, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    auth.uid(),
    now() + make_interval(days => greatest(1, coalesce(p_expires_days, 14)))
  )
  returning * into invite_row;

  return jsonb_build_object(
    'id', invite_row.id,
    'token', invite_row.token,
    'institute_type', invite_row.institute_type,
    'academy_sector', invite_row.academy_sector,
    'workspace_name_hint', invite_row.workspace_name_hint,
    'email', invite_row.email,
    'expires_at', invite_row.expires_at
  );
end;
$$;

create or replace function public.get_platform_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.platform_invites%rowtype;
begin
  select * into invite_row
  from public.platform_invites pi
  where pi.token = trim(coalesce(p_token, ''))
  limit 1;

  if invite_row.id is null then
    raise exception 'Invite not found';
  end if;

  if invite_row.used_at is not null then
    raise exception 'Invite already used';
  end if;

  if invite_row.expires_at < now() then
    raise exception 'Invite expired';
  end if;

  return jsonb_build_object(
    'token', invite_row.token,
    'email', invite_row.email,
    'institute_type', invite_row.institute_type,
    'academy_sector', invite_row.academy_sector,
    'workspace_name_hint', invite_row.workspace_name_hint,
    'note', invite_row.note,
    'expires_at', invite_row.expires_at
  );
end;
$$;

create or replace function public.consume_platform_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.platform_invites%rowtype;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  select * into invite_row
  from public.platform_invites pi
  where pi.token = trim(coalesce(p_token, ''))
  limit 1
  for update;

  if invite_row.id is null then
    raise exception 'Invite not found';
  end if;

  if invite_row.used_at is not null then
    raise exception 'Invite already used';
  end if;

  if invite_row.expires_at < now() then
    raise exception 'Invite expired';
  end if;

  if invite_row.email is not null and lower(invite_row.email) <> caller_email then
    raise exception 'This invite is locked to a different email address';
  end if;

  update public.platform_invites
  set used_by = auth.uid(),
      used_at = now()
  where id = invite_row.id;

  return jsonb_build_object(
    'institute_type', invite_row.institute_type,
    'academy_sector', invite_row.academy_sector,
    'workspace_name_hint', invite_row.workspace_name_hint
  );
end;
$$;

create or replace function public.list_platform_invites()
returns table (
  id uuid,
  token text,
  email text,
  institute_type text,
  academy_sector text,
  workspace_name_hint text,
  note text,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin access required';
  end if;

  return query
  select
    pi.id,
    pi.token,
    pi.email,
    pi.institute_type,
    pi.academy_sector,
    pi.workspace_name_hint,
    pi.note,
    pi.used_at,
    pi.expires_at,
    pi.created_at
  from public.platform_invites pi
  order by pi.created_at desc
  limit 100;
end;
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.list_platform_workspaces() to authenticated;
grant execute on function public.create_platform_invite(text, text, text, text, text, integer) to authenticated;
grant execute on function public.get_platform_invite(text) to authenticated, anon;
grant execute on function public.consume_platform_invite(text) to authenticated;
grant execute on function public.list_platform_invites() to authenticated;

-- Seed platform admins (add your email in Supabase SQL if not listed)
insert into public.platform_admins (email)
values
  ('admin@classflow.lk'),
  ('mohamed@lgroup.global')
on conflict (email) do nothing;
