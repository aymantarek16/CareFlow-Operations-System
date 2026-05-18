-- ============================================================
-- CareFlow — Step 8: Security Hardening
-- ============================================================
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor بعد ملف 07.
--
-- يقوم بالآتي:
--   1) يضمن أن RLS مفعّل على كل الجداول الحساسة.
--   2) يضيف policy يمنع تغيير دور المستخدم (role) إلا من الـ admin
--      حتى لا يستطيع مستخدم عادي ترقية نفسه إلى admin من الفرونت.
--   3) يضيف فحص بسيط على جدول الفواتير لمنع المبالغ السالبة.
--   4) يحرم التشغيل المباشر لجداول مهمة من دور anon (للقراءة قبل تسجيل الدخول).
--
-- كل التغييرات idempotent (يمكن تشغيلها أكثر من مرة بدون خطأ).
-- ============================================================


-- ===================================================
-- 1) Enforce RLS (defensive — لو شخص عطّلها يدوياً)
-- ===================================================
alter table public.users           force row level security;
alter table public.doctors         force row level security;
alter table public.patients        force row level security;
alter table public.appointments    force row level security;
alter table public.medical_records force row level security;
alter table public.prescriptions   force row level security;
alter table public.invoices        force row level security;
alter table public.activity_logs   force row level security;
alter table public.notifications   force row level security;

update public.users
  set role = 'patient'
  where role is null;

alter table public.users
  alter column role set default 'patient',
  alter column role set not null;


-- ===================================================
-- 2) Block role-escalation: مستخدم عادي لا يقدر يعدل عمود role
-- ===================================================
-- نستخدم trigger BEFORE UPDATE لأن RLS لا يمنع تغيير عمود معين،
-- بل يمنع الصف بالكامل. نريد منع فقط تعديل `role` إلا من الـ admin.

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- إذا تغيّر الدور والمستخدم الحالي ليس admin، ارفض التعديل.
  if new.role is distinct from old.role and not (select public.is_admin()) then
    raise exception 'role change not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_change on public.users;
create trigger trg_prevent_self_role_change
  before update on public.users
  for each row
  execute function public.prevent_self_role_change();


-- ===================================================
-- 3) Invoice amount sanity check (لا تسمح بقيم سالبة)
-- ===================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_amount_nonneg'
  ) then
    alter table public.invoices
      add constraint invoices_amount_nonneg
      check (amount >= 0);
  end if;
end $$;


-- ===================================================
-- 4) قطع وصول anon عن الجداول الحساسة (مع الإبقاء على RLS كاحتياطي ثاني)
-- ===================================================
-- ملاحظة: anon هو الدور المستخدم قبل تسجيل الدخول.
-- المفترض أن كل البيانات الطبية لا تظهر للزائر العام إطلاقًا.
revoke all on public.medical_records from anon;
revoke all on public.prescriptions   from anon;
revoke all on public.invoices        from anon;
revoke all on public.activity_logs   from anon;
revoke all on public.appointments    from anon;
revoke all on public.patients        from anon;
revoke all on public.doctors         from anon;
revoke all on public.users           from anon;
revoke all on public.notifications   from anon;


-- ===================================================
-- 5) Activity log helper (يمكن استدعاؤه من triggers لاحقاً)
-- ===================================================
-- يطابق schema الجدول الفعلي: id, user_id, user_name, action, entity_type,
-- entity_id, details (text), created_at.
create or replace function public.log_activity(
  p_action       text,
  p_entity_type  text default null,
  p_entity_id    text default null,
  p_details      text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.activity_logs (user_id, action, entity_type, entity_id, details, created_at)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, p_details, now());
$$;

grant execute on function public.log_activity(text, text, text, text) to authenticated;
