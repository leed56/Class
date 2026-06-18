-- Sprint 8: Sri Lankan sector model — workspace academy_sector + class metadata

alter table public.workspaces
  add column if not exists academy_sector text;

comment on column public.workspaces.academy_sector is
  'Primary teaching vertical for academy workspaces (school_tuition, maritime, it_technology, etc.)';

alter table public.classes
  add column if not exists sector text,
  add column if not exists session_type text,
  add column if not exists qualification_level text,
  add column if not exists intake_label text;

comment on column public.classes.sector is 'Academy sector for this class/course';
comment on column public.classes.session_type is 'theory, revision, paper, practical, simulator, lab, etc.';
comment on column public.classes.qualification_level is 'school_session, certificate, diploma, module, short_course, etc.';

update public.workspaces
set academy_sector = case institute_type
  when 'solo' then 'school_tuition'
  when 'institute' then 'school_tuition'
  else coalesce(academy_sector, 'school_tuition')
end
where academy_sector is null;

update public.classes
set
  sector = coalesce(sector, 'school_tuition'),
  session_type = coalesce(
    session_type,
    case
      when subject like '% — Revision%' then 'revision'
      when subject like '% — Paper class%' then 'paper'
      when subject like '% — Mass lecture%' then 'mass'
      when subject like '% — Theory%' then 'theory'
      when subject ilike 'STCW%' or subject ilike '%Simulator%' then 'practical'
      else 'theory'
    end
  ),
  qualification_level = coalesce(qualification_level, 'school_session')
where sector is null or session_type is null or qualification_level is null;
