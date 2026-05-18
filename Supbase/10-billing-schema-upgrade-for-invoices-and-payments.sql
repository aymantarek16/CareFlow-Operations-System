-- ============================================================
-- CareFlow — Step 9: Billing System Enhancements
-- شغّل الملف ده مرة واحدة في Supabase SQL Editor
-- آمن لإعادة التشغيل (يستخدم IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- 1) إضافة أعمدة ناقصة على invoices
-- ============================================================
alter table public.invoices
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null,
  add column if not exists doctor_id      uuid references public.doctors(id)      on delete set null,
  add column if not exists subtotal       numeric(10,2) not null default 0,
  add column if not exists discount       numeric(10,2) not null default 0 check (discount >= 0),
  add column if not exists tax            numeric(10,2) not null default 0 check (tax >= 0),
  add column if not exists total_amount   numeric(10,2) not null default 0 check (total_amount >= 0),
  add column if not exists paid_amount    numeric(10,2) not null default 0 check (paid_amount >= 0);

create index if not exists idx_invoices_appointment on public.invoices(appointment_id);
create index if not exists idx_invoices_doctor      on public.invoices(doctor_id);
create index if not exists idx_invoices_issue_date  on public.invoices(issue_date desc);

-- Tighten invoice visibility after doctor_id/appointment_id exist.
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or exists (
      select 1 from public.patients p
      where p.id = invoices.patient_id and p.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.doctors d
      where d.id = invoices.doctor_id and d.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.appointments a
      join public.doctors d on d.id = a.doctor_id
      where a.id = invoices.appointment_id
        and d.user_id = (select auth.uid())
    )
  );

create or replace function public.tg_validate_invoice_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_doctor_id uuid;
begin
  if new.appointment_id is not null then
    select patient_id, doctor_id
      into v_patient_id, v_doctor_id
      from public.appointments
      where id = new.appointment_id;

    if v_patient_id is null then
      raise exception 'invalid appointment_id';
    end if;

    if new.patient_id is distinct from v_patient_id then
      raise exception 'invoice patient does not match appointment patient';
    end if;

    if new.doctor_id is null then
      new.doctor_id := v_doctor_id;
    elsif new.doctor_id is distinct from v_doctor_id then
      raise exception 'invoice doctor does not match appointment doctor';
    end if;
  end if;

  if coalesce(new.total_amount, 0) = 0 and coalesce(new.amount, 0) > 0 then
    new.total_amount := new.amount;
    new.subtotal := coalesce(nullif(new.subtotal, 0), new.amount);
  end if;

  new.amount := greatest(new.total_amount, 0);
  return new;
end;
$$;

drop trigger if exists validate_invoice_links on public.invoices;
create trigger validate_invoice_links
  before insert or update on public.invoices
  for each row execute function public.tg_validate_invoice_links();

-- ============================================================
-- 2) تحديث constraint الحالة لإضافة partially_paid
-- ============================================================
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices
  add constraint invoices_status_check
  check (status in ('pending','partially_paid','paid','cancelled','refunded'));

-- ============================================================
-- 3) جدول invoice_items (الخدمات/البنود داخل الفاتورة)
-- ============================================================
create table if not exists public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  service_name text not null,
  quantity    integer not null default 1 check (quantity > 0),
  unit_price  numeric(10,2) not null default 0 check (unit_price >= 0),
  total       numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at  timestamptz default now()
);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);

-- ============================================================
-- 4) جدول payments (المدفوعات)
-- ============================================================
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  method      text not null default 'cash'
              check (method in ('cash','card','vodafone_cash','instapay','other')),
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);
create index if not exists idx_payments_invoice    on public.payments(invoice_id);
create index if not exists idx_payments_patient    on public.payments(patient_id);
create index if not exists idx_payments_created_at on public.payments(created_at desc);

-- ============================================================
-- 5) تفعيل RLS وforce على الجداول الجديدة
-- ============================================================
alter table public.invoice_items enable row level security;
alter table public.invoice_items force row level security;
alter table public.payments      enable row level security;
alter table public.payments      force row level security;

-- ============================================================
-- 6) RLS Policies — invoice_items
-- نفس صلاحيات الفاتورة الأم
-- ============================================================
drop policy if exists invoice_items_select on public.invoice_items;
drop policy if exists invoice_items_insert on public.invoice_items;
drop policy if exists invoice_items_update on public.invoice_items;
drop policy if exists invoice_items_delete on public.invoice_items;

create policy invoice_items_select on public.invoice_items
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or exists (
      select 1 from public.invoices inv
      join public.patients p on p.id = inv.patient_id
      where inv.id = invoice_items.invoice_id and p.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.invoices inv
      join public.doctors d on d.id = inv.doctor_id
      where inv.id = invoice_items.invoice_id and d.user_id = (select auth.uid())
    )
  );

create policy invoice_items_insert on public.invoice_items
  for insert to authenticated
  with check ((select public.is_admin()) or (select public.current_role()) = 'receptionist');

create policy invoice_items_update on public.invoice_items
  for update to authenticated
  using ((select public.is_admin()) or (select public.current_role()) = 'receptionist')
  with check ((select public.is_admin()) or (select public.current_role()) = 'receptionist');

create policy invoice_items_delete on public.invoice_items
  for delete to authenticated
  using ((select public.is_admin()) or (select public.current_role()) = 'receptionist');

-- ============================================================
-- 7) RLS Policies — payments
-- ============================================================
drop policy if exists payments_select on public.payments;
drop policy if exists payments_insert on public.payments;
drop policy if exists payments_update on public.payments;
drop policy if exists payments_delete on public.payments;

create policy payments_select on public.payments
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_role()) = 'receptionist'
    or exists (
      select 1 from public.patients p
      where p.id = payments.patient_id and p.user_id = (select auth.uid())
    )
  );

create policy payments_insert on public.payments
  for insert to authenticated
  with check (
    ((select public.is_admin()) or (select public.current_role()) = 'receptionist')
    and exists (
      select 1 from public.invoices inv
      where inv.id = payments.invoice_id
        and inv.patient_id = payments.patient_id
        and inv.status not in ('cancelled','refunded')
    )
  );

-- المدفوعات لا تُعدّل ولا تُحذف من العميل (audit-safe).
-- أي تصحيح/استرداد يتم بإجراء إداري منفصل وليس بتغيير السجل الأصلي.
create policy payments_update on public.payments
  for update to authenticated
  using (false)
  with check (false);

create policy payments_delete on public.payments
  for delete to authenticated
  using (false);

create or replace function public.tg_validate_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_total numeric(10,2);
  v_paid numeric(10,2);
  v_status text;
begin
  select patient_id, total_amount, status
    into v_patient_id, v_total, v_status
    from public.invoices
    where id = new.invoice_id;

  if v_patient_id is null then
    raise exception 'invalid invoice_id';
  end if;

  if new.patient_id is distinct from v_patient_id then
    raise exception 'payment patient does not match invoice patient';
  end if;

  if v_status in ('cancelled','refunded') then
    raise exception 'cannot record payment for cancelled/refunded invoice';
  end if;

  select coalesce(sum(amount), 0)
    into v_paid
    from public.payments
    where invoice_id = new.invoice_id
      and id is distinct from new.id;

  if v_paid + new.amount > v_total then
    raise exception 'payment exceeds invoice remaining balance';
  end if;

  new.created_by := coalesce(new.created_by, (select auth.uid()));
  return new;
end;
$$;

drop trigger if exists validate_payment on public.payments;
create trigger validate_payment
  before insert or update on public.payments
  for each row execute function public.tg_validate_payment();

-- ============================================================
-- 8) Trigger: مزامنة invoice.paid_amount + status من payments
-- ============================================================
create or replace function public.tg_recalc_invoice_after_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_total      numeric(10,2);
  v_paid       numeric(10,2);
  v_status     text;
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(amount), 0) into v_paid
    from public.payments where invoice_id = v_invoice_id;

  select total_amount, status into v_total, v_status
    from public.invoices where id = v_invoice_id;

  -- لا نغيّر الحالة لو الفاتورة ملغية أو مستردة
  if v_status in ('cancelled','refunded') then
    update public.invoices set paid_amount = v_paid where id = v_invoice_id;
    return coalesce(new, old);
  end if;

  if v_paid <= 0 then
    v_status := 'pending';
  elsif v_paid < v_total then
    v_status := 'partially_paid';
  else
    v_status := 'paid';
  end if;

  update public.invoices
    set paid_amount = v_paid,
        status      = v_status
    where id = v_invoice_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists payments_recalc_invoice on public.payments;
create trigger payments_recalc_invoice
  after insert or update or delete on public.payments
  for each row execute function public.tg_recalc_invoice_after_payment();

-- ============================================================
-- 9) Trigger: مزامنة invoice.subtotal/total عند تغيّر invoice_items
-- ============================================================
create or replace function public.tg_recalc_invoice_after_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_subtotal   numeric(10,2);
  v_discount   numeric(10,2);
  v_tax        numeric(10,2);
  v_total      numeric(10,2);
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(quantity * unit_price), 0) into v_subtotal
    from public.invoice_items where invoice_id = v_invoice_id;

  select discount, tax into v_discount, v_tax
    from public.invoices where id = v_invoice_id;

  v_total := greatest(v_subtotal - coalesce(v_discount,0) + coalesce(v_tax,0), 0);

  update public.invoices
    set subtotal     = v_subtotal,
        total_amount = v_total
    where id = v_invoice_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists invoice_items_recalc on public.invoice_items;
create trigger invoice_items_recalc
  after insert or update or delete on public.invoice_items
  for each row execute function public.tg_recalc_invoice_after_items();

-- ============================================================
-- 10) Trigger: notification عند تسجيل دفعة
-- ============================================================
create or replace function public.tg_payment_notify()
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

  perform public.create_notification(
    v_patient_user_id,
    'دفعة جديدة',
    'تم تسجيل دفعة بمبلغ ' || new.amount::text || ' ج.م على فاتورتك',
    'invoice',
    new.invoice_id
  );
  return new;
end;
$$;

drop trigger if exists payment_notify on public.payments;
create trigger payment_notify
  after insert on public.payments
  for each row execute function public.tg_payment_notify();

-- ============================================================
-- 11) Backfill للفواتير القديمة (لو في فواتير قبل المايجريشن دي)
-- ============================================================
update public.invoices
  set total_amount = amount,
      subtotal     = amount
  where total_amount = 0 and amount > 0;

update public.invoices
  set paid_amount = amount
  where status = 'paid' and paid_amount = 0;

-- ============================================================
-- Done. لو شغل بدون أخطاء = الـ migration تمت بنجاح.
-- ============================================================
