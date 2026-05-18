-- CareFlow — Step 2:
-- 1) أعمدة ناقصة على patients (بيحاول الفرونت يحدّثها في PatientProfile)
alter table public.patients
  add column if not exists address text,
  add column if not exists emergency_contact text,
  add column if not exists medical_history text;

-- 2) medical_records
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id  uuid not null references public.doctors(id)  on delete cascade,
  title        text,
  diagnosis    text,
  prescription text,
  notes        text,
  attachments  text,
  created_at   timestamptz default now()
);
create index if not exists idx_medical_records_patient on public.medical_records(patient_id);
create index if not exists idx_medical_records_doctor  on public.medical_records(doctor_id);

-- 3) prescriptions
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id  uuid not null references public.doctors(id)  on delete cascade,
  medical_record_id uuid references public.medical_records(id) on delete set null,
  medication   text,
  dosage       text,
  frequency    text,
  duration     text,
  instructions text,
  status       text default 'active' check (status in ('active','completed','cancelled')),
  created_at   timestamptz default now()
);
create index if not exists idx_prescriptions_patient on public.prescriptions(patient_id);
create index if not exists idx_prescriptions_doctor  on public.prescriptions(doctor_id);

-- 4) invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  amount     numeric(10,2) not null default 0,
  status     text not null default 'pending'
             check (status in ('pending','paid','cancelled','refunded')),
  issue_date date default current_date,
  notes      text,
  created_at timestamptz default now()
);
create index if not exists idx_invoices_patient on public.invoices(patient_id);
create index if not exists idx_invoices_status  on public.invoices(status);

-- 5) departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz default now()
);

-- 6) system_settings
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- 7) activity_logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  user_name   text,
  action      text not null,
  entity_type text,
  entity_id   text,
  details     text,
  created_at  timestamptz default now()
);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);

-- 8) ضبط users (constraints على role و email)
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('admin','doctor','patient','receptionist'));

alter table public.users drop constraint if exists users_email_key;
alter table public.users add constraint users_email_key unique (email);

-- 9) unique على doctors.user_id و patients.user_id علشان user واحد = سجل واحد بس
alter table public.doctors  drop constraint if exists doctors_user_id_key;
alter table public.doctors  add  constraint doctors_user_id_key  unique (user_id);

alter table public.patients drop constraint if exists patients_user_id_key;
alter table public.patients add  constraint patients_user_id_key unique (user_id);
