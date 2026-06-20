-- Switch parent OTP SMS from Notify.lk to Text.lk
-- Edge function secrets: TEXT_LK_API_TOKEN, TEXT_LK_SENDER_ID (default TextLKDemo)
-- Optional DB flag: app.settings.text_lk_api_token (set in Supabase SQL if using DB-side enable check)

alter table if exists public.sms_outbox
  alter column provider set default 'text_lk';

create or replace function public.text_lk_sms_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('app.settings.text_lk_api_token', true), '') is not null,
    false
  );
$$;

create or replace function public.notify_lk_sms_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.text_lk_sms_enabled();
$$;

create or replace function public.enqueue_parent_otp_sms(target_phone text, otp_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  outbox_id uuid;
  sms_body text;
begin
  if not public.text_lk_sms_enabled() then
    return null;
  end if;

  sms_body := format('ClassFlow parent login code: %s. Valid for 10 minutes.', otp_code);

  insert into public.sms_outbox (phone, message, provider, purpose, status)
  values (target_phone, sms_body, 'text_lk', 'parent_otp', 'queued')
  returning id into outbox_id;

  return outbox_id;
end;
$$;

create or replace function public.request_parent_otp(raw_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  norm text;
  child_count int;
  otp_code text;
  otp_expires timestamptz;
  pilot_phone text := '94771234567';
  pilot_code text := '123456';
  sms_enabled boolean;
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

  sms_enabled := public.text_lk_sms_enabled();

  if norm = pilot_phone and not sms_enabled then
    otp_code := pilot_code;
  else
    otp_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  end if;

  otp_expires := now() + interval '10 minutes';

  insert into public.parent_otp_requests (phone, code, expires_at)
  values (norm, otp_code, otp_expires);

  perform public.enqueue_parent_otp_sms(norm, otp_code);

  return jsonb_build_object(
    'phone', norm,
    'childCount', child_count,
    'expiresAt', otp_expires,
    'code', case when sms_enabled then null else otp_code end,
    'smsQueued', sms_enabled
  );
end;
$$;

grant execute on function public.text_lk_sms_enabled() to anon, authenticated;
