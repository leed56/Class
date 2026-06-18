-- Fix ambiguous student_id references in parent portal RPCs

drop function if exists public.get_parent_student_overview(uuid, uuid);
drop function if exists public.get_parent_student_timeline(uuid, uuid);

create function public.get_parent_student_overview(session_id uuid, target_student_id uuid)
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
  perform public.assert_parent_session(session_id, target_student_id);

  select s.* into student_row
  from public.students s
  where s.id = target_student_id;

  select w.name into workspace_name
  from public.workspaces w
  where w.id = student_row.workspace_id;

  select count(*) into attendance_total
  from public.attendance_marks m
  where m.student_id = target_student_id;

  select count(*) into attendance_present
  from public.attendance_marks m
  where m.student_id = target_student_id
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
  where f.student_id = target_student_id;

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

create function public.get_parent_student_timeline(session_id uuid, target_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  receipts jsonb;
  certificates jsonb;
begin
  perform public.assert_parent_session(session_id, target_student_id);

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
  where p.student_id = target_student_id;

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
  where c.student_id = target_student_id;

  return jsonb_build_object(
    'receipts', receipts,
    'certificates', certificates
  );
end;
$$;

grant execute on function public.get_parent_student_overview(uuid, uuid) to anon, authenticated;
grant execute on function public.get_parent_student_timeline(uuid, uuid) to anon, authenticated;
