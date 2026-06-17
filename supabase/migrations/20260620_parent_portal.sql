-- Sprint 3: Parent portal OTP login and read-only child dashboard RPCs

create table if not exists public.parent_otp_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists parent_otp_requests_phone_created_idx
  on public.parent_otp_requests (phone, created_at desc);

create table if not exists public.parent_sessions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists parent_sessions_phone_idx
  on public.parent_sessions (phone, expires_at desc);

alter table public.parent_otp_requests enable row level security;
alter table public.parent_sessions enable row level security;

create or replace function public.normalize_parent_phone(raw_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  digits := regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g');
  if digits like '94%' and length(digits) >= 11 then
    return substring(digits from 1 for 11);
  elsif digits like '0%' and length(digits) >= 10 then
    return '94' || substring(digits from 2 for 9);
  elsif length(digits) = 9 then
    return '94' || digits;
  elsif length(digits) >= 10 then
    return digits;
  end if;
  return null;
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

  otp_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
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

create or replace function public.verify_parent_otp(raw_phone text, raw_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  norm text;
  cleaned_code text;
  otp_row public.parent_otp_requests%rowtype;
  session_id uuid;
  session_expires timestamptz;
  children jsonb;
begin
  norm := public.normalize_parent_phone(raw_phone);
  cleaned_code := trim(coalesce(raw_code, ''));
  if norm is null or cleaned_code = '' then
    raise exception 'Phone and code are required';
  end if;

  select * into otp_row
  from public.parent_otp_requests
  where phone = norm
    and code = cleaned_code
    and verified_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if otp_row.id is null then
    raise exception 'Invalid or expired code';
  end if;

  update public.parent_otp_requests
  set verified_at = now()
  where id = otp_row.id;

  session_expires := now() + interval '7 days';
  insert into public.parent_sessions (phone, expires_at)
  values (norm, session_expires)
  returning id into session_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.full_name,
        'grade', s.grade,
        'medium', s.medium,
        'workspaceId', s.workspace_id,
        'workspaceName', w.name
      )
      order by s.full_name
    ),
    '[]'::jsonb
  ) into children
  from public.students s
  join public.workspaces w on w.id = s.workspace_id
  where public.normalize_parent_phone(s.parent_phone) = norm
    and s.active = true;

  return jsonb_build_object(
    'sessionToken', session_id,
    'phone', norm,
    'expiresAt', session_expires,
    'children', children
  );
end;
$$;

create or replace function public.assert_parent_session(session_id uuid, target_student_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.parent_sessions%rowtype;
  norm text;
begin
  select * into session_row
  from public.parent_sessions
  where id = session_id
    and expires_at > now()
  limit 1;

  if session_row.id is null then
    raise exception 'Parent session expired. Please sign in again.';
  end if;

  if not exists (
    select 1
    from public.students s
    where s.id = target_student_id
      and s.active = true
      and public.normalize_parent_phone(s.parent_phone) = session_row.phone
  ) then
    raise exception 'You do not have access to this student record';
  end if;

  return session_row.phone;
end;
$$;

create or replace function public.get_parent_student_overview(session_id uuid, student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attendance_total int;
  attendance_present int;
  attendance_percent int;
  outstanding_amount numeric;
  paid_amount numeric;
  fee_status text;
  student_row public.students%rowtype;
  workspace_name text;
begin
  perform public.assert_parent_session(session_id, student_id);

  select s.* into student_row
  from public.students s
  where s.id = student_id;

  select w.name into workspace_name
  from public.workspaces w
  where w.id = student_row.workspace_id;

  select count(*) into attendance_total
  from public.attendance_marks m
  where m.student_id = student_id;

  select count(*) into attendance_present
  from public.attendance_marks m
  where m.student_id = student_id
    and m.status in ('present', 'late');

  attendance_percent := case
    when attendance_total = 0 then 0
    else round((attendance_present::numeric / attendance_total::numeric) * 100)
  end;

  select
    coalesce(sum(greatest(f.monthly_fee - f.paid_amount, 0)), 0),
    coalesce(sum(f.paid_amount), 0)
  into outstanding_amount, paid_amount
  from public.fee_invoices f
  where f.student_id = student_id;

  if outstanding_amount <= 0 then
    fee_status := 'paid';
  elsif paid_amount > 0 then
    fee_status := 'partial';
  else
    fee_status := 'pending';
  end if;

  return jsonb_build_object(
    'studentId', student_row.id,
    'studentName', student_row.full_name,
    'grade', student_row.grade,
    'medium', student_row.medium,
    'workspaceName', workspace_name,
    'attendancePercent', attendance_percent,
    'outstandingAmount', outstanding_amount,
    'paidAmount', paid_amount,
    'feeStatus', fee_status
  );
end;
$$;

create or replace function public.get_parent_student_timeline(session_id uuid, student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  receipts jsonb;
  certificates jsonb;
begin
  perform public.assert_parent_session(session_id, student_id);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'type', 'receipt',
        'title', p.receipt_no,
        'subtitle', 'Payment received',
        'amount', p.amount,
        'occurredOn', p.paid_at,
        'method', p.method
      )
      order by p.paid_at desc
    ),
    '[]'::jsonb
  ) into receipts
  from public.payments p
  where p.student_id = student_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'type', 'certificate',
        'title', c.title,
        'subtitle', c.serial_no,
        'occurredOn', c.issued_on,
        'certificateType', c.certificate_type,
        'revoked', c.revoked_at is not null
      )
      order by c.issued_on desc, c.created_at desc
    ),
    '[]'::jsonb
  ) into certificates
  from public.certificates c
  where c.student_id = student_id;

  return jsonb_build_object(
    'receipts', receipts,
    'certificates', certificates
  );
end;
$$;

grant execute on function public.normalize_parent_phone(text) to anon, authenticated;
grant execute on function public.request_parent_otp(text) to anon, authenticated;
grant execute on function public.verify_parent_otp(text, text) to anon, authenticated;
grant execute on function public.get_parent_student_overview(uuid, uuid) to anon, authenticated;
grant execute on function public.get_parent_student_timeline(uuid, uuid) to anon, authenticated;
