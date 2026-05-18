 -- ============================================================
-- CareFlow — Step 5: Seed defaults (departments + system_settings)
-- ============================================================
-- ON CONFLICT DO NOTHING علشان لو شغلت الملف أكتر من مرة ميخربش حاجة
-- ============================================================

-- 1) Departments الافتراضية
insert into public.departments (name, description) values
  ('Cardiology',       'قسم القلب والأوعية الدموية'),
  ('Pediatrics',       'قسم الأطفال'),
  ('Dermatology',      'قسم الجلدية'),
  ('Orthopedics',      'قسم العظام'),
  ('Neurology',        'قسم المخ والأعصاب'),
  ('General Medicine', 'طب عام'),
  ('Ophthalmology',    'قسم العيون'),
  ('ENT',              'قسم الأنف والأذن والحنجرة'),
  ('Dentistry',        'قسم الأسنان'),
  ('Gynecology',       'قسم النساء والتوليد')
on conflict (name) do nothing;

-- 2) System Settings الافتراضية (نفس المفاتيح اللي AdminSettings.tsx بيستخدمها)
insert into public.system_settings (key, value) values
  ('clinic_name',          'عيادة CareFlow'),
  ('clinic_address',       ''),
  ('clinic_phone',         ''),
  ('clinic_email',         ''),
  ('appointment_duration', '30'),
  ('working_hours_start',  '09:00'),
  ('working_hours_end',    '17:00')
on conflict (key) do nothing;
