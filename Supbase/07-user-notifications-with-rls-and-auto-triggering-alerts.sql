-- =============================================================================
-- CareFlow — Step 6: Notifications: schema + RLS + triggers
-- -----------------------------------------------------------------------------
-- Run this once in Supabase SQL Editor. Safe to re-run (uses IF NOT EXISTS /
-- CREATE OR REPLACE where possible).
-- =============================================================================

-- 1. Table ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text not null default 'info',   -- appointment | invoice | record | system | info
  related_id  uuid,                            -- fk to the originating row (appt/invoice/...) when useful
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read = false;

-- 2. RLS -----------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.notifications force row level security;

drop policy if exists "Users see own notifications"         on public.notifications;
drop policy if exists "Users update own notifications"      on public.notifications;
drop policy if exists "Users delete own notifications"      on public.notifications;
drop policy if exists "Anyone can insert notifications"     on public.notifications;
drop policy if exists "Admins see all notifications"        on public.notifications;

-- Each user reads only their own rows.
create policy "Users see own notifications"
  on public.notifications for select
  using ((select auth.uid()) = user_id);

-- Admins can see everything (for audit / debugging).
create policy "Admins see all notifications"
  on public.notifications for select
  using ((select public.is_admin()));

-- Users can mark their own notifications as read / unread.
create policy "Users update own notifications"
  on public.notifications for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Users can delete their own notifications.
create policy "Users delete own notifications"
  on public.notifications for delete
  using ((select auth.uid()) = user_id);

-- Inserts happen from server-side SECURITY DEFINER helpers/triggers only.
-- Direct client inserts are blocked to avoid notification spam/spoofing.
create policy "Anyone can insert notifications"
  on public.notifications for insert
  with check (false);

-- 3. Helper --------------------------------------------------------------------
create or replace function public.create_notification(
  target_user_id uuid,
  n_title text,
  n_message text,
  n_type  text default 'info',
  n_related_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then return; end if;
  insert into public.notifications (user_id, title, message, type, related_id)
  values (target_user_id, n_title, n_message, n_type, n_related_id);
end;
$$;

-- 4. Triggers ------------------------------------------------------------------

-- 4a. Appointment created / updated  -----------------------------------------------
create or replace function public.tg_appointment_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_user_id uuid;
  v_doctor_user_id  uuid;
  v_patient_name    text;
  v_doctor_name     text;
  v_when            text;
begin
  -- resolve the user_id for both sides
  select user_id, coalesce(first_name || ' ' || last_name, 'المريض')
    into v_patient_user_id, v_patient_name
    from public.patients where id = new.patient_id;

  select user_id, coalesce('د. ' || first_name || ' ' || last_name, 'الطبيب')
    into v_doctor_user_id, v_doctor_name
    from public.doctors where id = new.doctor_id;

  v_when := coalesce(to_char(new.appointment_date, 'YYYY-MM-DD'), '') ||
            case when new.appointment_time is not null
                 then ' ' || to_char(new.appointment_time, 'HH24:MI') else '' end;

  if tg_op = 'INSERT' then
    perform public.create_notification(
      v_patient_user_id,
      'تم حجز موعد جديد',
      'تم حجز موعدك مع ' || v_doctor_name || ' يوم ' || v_when,
      'appointment',
      new.id);
    perform public.create_notification(
      v_doctor_user_id,
      'موعد جديد',
      'لديك موعد جديد مع ' || v_patient_name || ' يوم ' || v_when,
      'appointment',
      new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.create_notification(
      v_patient_user_id,
      'تحديث حالة الموعد',
      'تم تحديث حالة موعدك إلى: ' || coalesce(new.status, '-'),
      'appointment',
      new.id);
    perform public.create_notification(
      v_doctor_user_id,
      'تحديث حالة الموعد',
      'تم تحديث حالة الموعد مع ' || v_patient_name || ' إلى: ' || coalesce(new.status, '-'),
      'appointment',
      new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists appointment_notify on public.appointments;
create trigger appointment_notify
  after insert or update on public.appointments
  for each row execute function public.tg_appointment_notify();

-- 4b. Invoice created / updated  -------------------------------------------------
create or replace function public.tg_invoice_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_user_id uuid;
begin
  select user_id into v_patient_user_id
    from public.patients where id = new.patient_id;

  if tg_op = 'INSERT' then
    perform public.create_notification(
      v_patient_user_id,
      'فاتورة جديدة',
      'تم إصدار فاتورة بمبلغ ' || new.amount::text || ' ج.م',
      'invoice',
      new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.create_notification(
      v_patient_user_id,
      'تحديث حالة الفاتورة',
      'تم تحديث حالة الفاتورة إلى: ' || coalesce(new.status, '-'),
      'invoice',
      new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists invoice_notify on public.invoices;
create trigger invoice_notify
  after insert or update on public.invoices
  for each row execute function public.tg_invoice_notify();

-- 4c. Medical record created  ---------------------------------------------------
create or replace function public.tg_medical_record_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_user_id uuid;
  v_doctor_name     text;
begin
  select user_id into v_patient_user_id
    from public.patients where id = new.patient_id;

  select coalesce('د. ' || first_name || ' ' || last_name, 'الطبيب') into v_doctor_name
    from public.doctors where id = new.doctor_id;

  perform public.create_notification(
    v_patient_user_id,
    'سجل طبي جديد',
    'تم إضافة سجل طبي جديد بواسطة ' || v_doctor_name,
    'record',
    new.id);
  return new;
end;
$$;

drop trigger if exists medical_record_notify on public.medical_records;
create trigger medical_record_notify
  after insert on public.medical_records
  for each row execute function public.tg_medical_record_notify();

-- Done.
