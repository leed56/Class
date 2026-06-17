-- Phase 2b: certification eligibility rules

alter table public.workspaces
  add column if not exists min_attendance_for_certificate integer not null default 75
    check (min_attendance_for_certificate between 0 and 100),
  add column if not exists require_fees_clear_for_certificate boolean not null default true;
