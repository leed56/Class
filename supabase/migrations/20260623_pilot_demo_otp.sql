-- Pilot demo auth: fixed parent OTP and demo parent phone on one student per workspace

create or replace function public.request_parent_otp(raw_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  norm text;
  child_count int;
  otp_code text := '123456';
  otp_expires timestamptz;
begin
  norm := public.normalize_parent_phone(raw_phone);
  if norm is null then
    raise exception 'Invalid phone number';
  end if;

  select count(*) into child_count
  from public.students s
  where public.normalize_parent_phone(s.parent_phone) = norm
    and s.active = true;

  if child_count = 0 then
    raise exception 'No students found for this parent phone';
  end if;

  otp_expires := now() + interval '10 minutes';

  insert into public.parent_otp_requests (phone, code, expires_at)
  values (norm, otp_code, otp_expires);

  return jsonb_build_object(
    'phone', norm,
    'childCount', child_count,
    'expiresAt', otp_expires,
    'code', otp_code
  );
end;
$$;

-- Tag one active student per workspace with the shared demo parent phone for pilot logins
update public.students s
set parent_phone = '94771234567'
from (
  select distinct on (workspace_id) id
  from public.students
  where active = true
  order by workspace_id, created_at
) demo_target
where s.id = demo_target.id
  and public.normalize_parent_phone(s.parent_phone) is distinct from '94771234567';
