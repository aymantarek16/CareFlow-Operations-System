 -- ============================================================
-- CareFlow — Step 4: RLS Policies (كامل لكل الجداول)
-- ============================================================
-- هذا الملف:
--   1) ينشئ دوال مساعدة (is_admin, current_role) بـ SECURITY DEFINER
--      علشان نتفادى الـ recursion داخل الـ policies.
--   2) يفعّل RLS على جميع الجداول.
--   3) يحذف أي policies قديمة على نفس الجداول ثم يعيد إنشاءها
--      بأسلوب موحّد (SELECT + INSERT + UPDATE + DELETE) لكل دور.
-- الأدوار: admin, doctor, patient, receptionist
-- ============================================================


-- ===================================================
-- 1) Helper functions (bypass RLS via SECURITY DEFINER)
-- ===================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.users where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = (select auth.uid());
$$;

create or replace function public.is_patient_profile(p_patient_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1
    from public.patients p
    where p.id = p_patient_id
      and p.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_doctor_profile(p_doctor_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1
    from public.doctors d
    where d.id = p_doctor_id
      and d.user_id = (select auth.uid())
  );
$$;

create or replace function public.doctor_can_access_patient(p_patient_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1
    from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where a.patient_id = p_patient_id
      and d.user_id = (select auth.uid())
  );
$$;

-- صلاحيات التنفيذ
grant execute on function public.is_admin()     to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_patient_profile(uuid)       to authenticated;
grant execute on function public.is_doctor_profile(uuid)        to authenticated;
grant execute on function public.doctor_can_access_patient(uuid) to authenticated;


-- ===================================================
-- 2) تفعيل RLS على كل الجداول
-- ===================================================
alter table public.users             enable row level security;
alter table public.doctors           enable row level security;
alter table public.patients          enable row level security;
alter table public.appointments      enable row level security;
alter table public.medical_records   enable row level security;
alter table public.prescriptions     enable row level security;
alter table public.invoices          enable row level security;
alter table public.departments       enable row level security;
alter table public.system_settings   enable row level security;
alter table public.activity_logs     enable row level security;


-- ===================================================
-- 3) حذف أي policies قديمة (نبدأ نظيف)
-- ===================================================
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users','doctors','patients','appointments',
        'medical_records','prescriptions','invoices',
        'departments','system_settings','activity_logs'
      )
  loop
    execute format('drop policy if exists %I on %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;


-- ===================================================
-- 4) Policies — users
-- ===================================================
-- قراءة: المستخدم يشوف نفسه، Admin يشوف الكل
create policy users_select on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
  );

-- إنشاء: يسمح للـ Register.tsx بعمل insert للبروفايل بتاعه
create policy users_insert_self on public.users
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and role = 'patient'
  );

-- تعديل: المستخدم يعدّل نفسه، Admin يعدّل أي حد
create policy users_update on public.users
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- حذف: Admin فقط
create policy users_delete on public.users
  for delete to authenticated
  using ((select public.is_admin()));


-- ===================================================
-- 5) Policies — doctors
-- ===================================================
-- قراءة: كل مستخدم مسجل دخول (عشان قوائم الأطباء في الحجز)
create policy doctors_select on public.doctors
  for select to authenticated
  using (true);

-- إنشاء: Admin فقط (Admin بينشئ حسابات الدكاترة)
create policy doctors_insert on public.doctors
  for insert to authenticated
  with check ((select public.is_admin()));

-- تعديل: الدكتور يعدّل نفسه، Admin يعدّل الكل
create policy doctors_update on public.doctors
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

-- حذف: Admin فقط
create policy doctors_delete on public.doctors
  for delete to authenticated
  using ((select public.is_admin()));


-- ===================================================
-- 6) Policies — patients
-- ===================================================
-- قراءة: المريض يشوف نفسه، Admin/Receptionist يشوفوا الكل،
--        والدكتور يشوف المرضى المرتبطين بمواعيده فقط.
create policy patients_select on public.patients
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or (select public.doctor_can_access_patient(patients.id))
  );

-- إنشاء: المريض ينشئ نفسه (Register.tsx)،
--        Admin/Receptionist ينشئوا أي مريض
create policy patients_insert on public.patients
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
  );

-- تعديل: المريض يعدّل نفسه، Admin/Receptionist يعدّلوا أي مريض
create policy patients_update on public.patients
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
  )
  with check (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
  );

-- حذف: Admin فقط
create policy patients_delete on public.patients
  for delete to authenticated
  using ((select public.is_admin()));


-- ===================================================
-- 7) Policies — appointments
-- ===================================================
-- قراءة: المريض يشوف مواعيده، الدكتور يشوف مواعيده،
--        Admin/Receptionist يشوفوا الكل
create policy appointments_select on public.appointments
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or (select public.is_patient_profile(appointments.patient_id))
    or (select public.is_doctor_profile(appointments.doctor_id))
  );

-- إنشاء: المريض لنفسه، Admin/Receptionist لأي مريض
create policy appointments_insert on public.appointments
  for insert to authenticated
  with check (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or (select public.is_patient_profile(appointments.patient_id))
  );

-- تعديل: الدكتور يحدّث مواعيده، Admin/Receptionist يديروا المواعيد.
create policy appointments_update on public.appointments
  for update to authenticated
  using (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or (select public.is_doctor_profile(appointments.doctor_id))
  )
  with check (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or (select public.is_doctor_profile(appointments.doctor_id))
  );

-- حذف: Admin/Receptionist فقط
create policy appointments_delete on public.appointments
  for delete to authenticated
  using ((select public.is_admin()) or (select public.current_role()) = 'receptionist');


-- ===================================================
-- 8) Policies — medical_records
-- ===================================================
-- قراءة: المريض يشوف سجلاته، الدكتور يشوف سجلاته، Admin يشوف الكل
create policy medical_records_select on public.medical_records
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.is_patient_profile(medical_records.patient_id))
    or (select public.is_doctor_profile(medical_records.doctor_id))
  );

-- إنشاء: الدكتور فقط (لمرضاه) أو Admin
create policy medical_records_insert on public.medical_records
  for insert to authenticated
  with check (
    (select public.is_admin())
    or (
      (select public.is_doctor_profile(medical_records.doctor_id))
      and (select public.doctor_can_access_patient(medical_records.patient_id))
    )
  );

-- تعديل: الدكتور المالك أو Admin
create policy medical_records_update on public.medical_records
  for update to authenticated
  using (
    (select public.is_admin())
    or (select public.is_doctor_profile(medical_records.doctor_id))
  )
  with check (
    (select public.is_admin())
    or (select public.is_doctor_profile(medical_records.doctor_id))
  );

-- حذف: Admin فقط
create policy medical_records_delete on public.medical_records
  for delete to authenticated
  using ((select public.is_admin()));


-- ===================================================
-- 9) Policies — prescriptions
-- ===================================================
create policy prescriptions_select on public.prescriptions
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.is_patient_profile(prescriptions.patient_id))
    or (select public.is_doctor_profile(prescriptions.doctor_id))
  );

create policy prescriptions_insert on public.prescriptions
  for insert to authenticated
  with check (
    (select public.is_admin())
    or (
      (select public.is_doctor_profile(prescriptions.doctor_id))
      and (select public.doctor_can_access_patient(prescriptions.patient_id))
    )
  );

create policy prescriptions_update on public.prescriptions
  for update to authenticated
  using (
    (select public.is_admin())
    or (select public.is_doctor_profile(prescriptions.doctor_id))
  )
  with check (
    (select public.is_admin())
    or (select public.is_doctor_profile(prescriptions.doctor_id))
  );

create policy prescriptions_delete on public.prescriptions
  for delete to authenticated
  using ((select public.is_admin()));


-- ===================================================
-- 10) Policies — invoices
-- ===================================================
-- قراءة: المريض لفواتيره، Admin/Receptionist للكل
create policy invoices_select on public.invoices
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or (select public.is_patient_profile(invoices.patient_id))
  );

-- إنشاء/تعديل: Admin/Receptionist فقط
create policy invoices_insert on public.invoices
  for insert to authenticated
  with check ((select public.is_admin()) or (select public.current_role()) = 'receptionist');

create policy invoices_update on public.invoices
  for update to authenticated
  using ((select public.is_admin()) or (select public.current_role()) = 'receptionist')
  with check ((select public.is_admin()) or (select public.current_role()) = 'receptionist');

create policy invoices_delete on public.invoices
  for delete to authenticated
  using ((select public.is_admin()));


-- ===================================================
-- 11) Policies — departments
-- ===================================================
create policy departments_select on public.departments
  for select to authenticated using (true);

create policy departments_insert on public.departments
  for insert to authenticated with check ((select public.is_admin()));

create policy departments_update on public.departments
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy departments_delete on public.departments
  for delete to authenticated using ((select public.is_admin()));


-- ===================================================
-- 12) Policies — system_settings
-- ===================================================
-- قراءة: كل المستخدمين المسجلين (بعض الإعدادات عامة)
create policy system_settings_select on public.system_settings
  for select to authenticated using (true);

-- كتابة/تعديل/حذف: Admin فقط
create policy system_settings_insert on public.system_settings
  for insert to authenticated with check ((select public.is_admin()));

create policy system_settings_update on public.system_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy system_settings_delete on public.system_settings
  for delete to authenticated using ((select public.is_admin()));


-- ===================================================
-- 13) Policies — activity_logs
-- ===================================================
-- قراءة: Admin فقط
create policy activity_logs_select on public.activity_logs
  for select to authenticated using ((select public.is_admin()));

-- كتابة: أي مستخدم مسجل (لكن لازم يكون هو نفسه)
create policy activity_logs_insert on public.activity_logs
  for insert to authenticated
  with check (false);

-- تعديل/حذف: Admin فقط
create policy activity_logs_update on public.activity_logs
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy activity_logs_delete on public.activity_logs
  for delete to authenticated using ((select public.is_admin()));
