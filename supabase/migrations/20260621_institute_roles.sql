-- Sprint 5: Institute roles, staff management RPCs, and admin workspace updates

alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;

alter table public.workspace_members
  add constraint workspace_members_role_check
  check (role in ('owner', 'teacher', 'admin', 'front_desk'));

create or replace function public.get_workspace_role(target_workspace uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_workspace_role(target_workspace) in ('owner', 'admin'), false);
$$;

drop policy if exists "Owners can update own workspaces" on public.workspaces;
create policy "Admins can update workspaces" on public.workspaces
  for update using (public.is_workspace_admin(id))
  with check (public.is_workspace_admin(id));

drop policy if exists "Owners can add themselves as member" on public.workspace_members;
drop policy if exists "Owners can manage workspace members" on public.workspace_members;
drop policy if exists "Members can read workspace members" on public.workspace_members;

create policy "Members can read workspace members" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

create policy "Owners can manage workspace members" on public.workspace_members
  for all using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create or replace function public.list_workspace_staff(p_workspace_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Not a workspace member';
  end if;

  return query
  select
    wm.user_id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name', '')::text as full_name,
    wm.role,
    wm.created_at
  from public.workspace_members wm
  join auth.users u on u.id = wm.user_id
  where wm.workspace_id = p_workspace_id
  order by
    case wm.role
      when 'owner' then 1
      when 'admin' then 2
      when 'teacher' then 3
      when 'front_desk' then 4
      else 5
    end,
    wm.created_at;
end;
$$;

create or replace function public.add_workspace_member_by_email(
  p_workspace_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
  normalized_email text;
begin
  if not public.is_workspace_owner(p_workspace_id) then
    raise exception 'Only the workspace owner can add staff';
  end if;

  normalized_email := lower(trim(coalesce(p_email, '')));
  if normalized_email = '' then
    raise exception 'Email is required';
  end if;

  if p_role not in ('admin', 'teacher', 'front_desk') then
    raise exception 'Invalid staff role';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'No account found for this email. Ask them to sign up first.';
  end if;

  if exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = target_user_id
  ) then
    raise exception 'This person is already on your staff list';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (p_workspace_id, target_user_id, p_role);

  return jsonb_build_object(
    'user_id', target_user_id,
    'email', normalized_email,
    'role', p_role
  );
end;
$$;

create or replace function public.update_workspace_member_role(
  p_workspace_id uuid,
  p_user_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  if not public.is_workspace_owner(p_workspace_id) then
    raise exception 'Only the workspace owner can change staff roles';
  end if;

  if p_role not in ('admin', 'teacher', 'front_desk') then
    raise exception 'Invalid staff role';
  end if;

  select wm.role into current_role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = p_user_id;

  if current_role is null then
    raise exception 'Staff member not found';
  end if;

  if current_role = 'owner' then
    raise exception 'Cannot change the owner role';
  end if;

  update public.workspace_members
  set role = p_role
  where workspace_id = p_workspace_id
    and user_id = p_user_id;

  return jsonb_build_object('user_id', p_user_id, 'role', p_role);
end;
$$;

create or replace function public.remove_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  if not public.is_workspace_owner(p_workspace_id) then
    raise exception 'Only the workspace owner can remove staff';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot remove yourself';
  end if;

  select wm.role into current_role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = p_user_id;

  if current_role is null then
    raise exception 'Staff member not found';
  end if;

  if current_role = 'owner' then
    raise exception 'Cannot remove the workspace owner';
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = p_user_id;

  return jsonb_build_object('removed_user_id', p_user_id);
end;
$$;

grant execute on function public.list_workspace_staff(uuid) to authenticated;
grant execute on function public.add_workspace_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.update_workspace_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
