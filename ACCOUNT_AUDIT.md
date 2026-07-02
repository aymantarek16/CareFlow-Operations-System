# CareFlow Account Audit

تاريخ المراجعة: 2026-07-02

هذا الملف يلخص حالة الحسابات بين:

- Supabase Authentication
- `public.users`
- `public.doctors`
- `public.patients`

الهدف: معرفة الحسابات السليمة، الحسابات اليتيمة، والحسابات التي تحتاج ربط Profile.

## الحسابات السليمة التي يجب تركها

هذه الحسابات مربوطة بشكل صحيح ولا ينصح بحذفها:

| الحساب | الدور | الحالة |
| --- | --- | --- |
| `admin@careflow.com` | admin | سليم |
| `receptionist@careflow.com` | receptionist | سليم |
| `doctor@careflow.com` | doctor | سليم ومربوط بصف في `doctors` وعليه بيانات مرتبطة |
| `patient@careflow.com` | patient | سليم ومربوط بصف في `patients` وعليه بيانات مرتبطة |
| `hamdy_rady@careflow.com` | doctor | سليم ومربوط بصف في `doctors` |

## حسابات موجودة في `public.users` فقط

هذه الحسابات موجودة في جدول `public.users` لكنها غير موجودة في Supabase Authentication.
يفضل حذفها من `public.users` لأنها حسابات يتيمة ولن تستطيع تسجيل الدخول.

| الحساب | الدور الحالي | الإجراء المقترح |
| --- | --- | --- |
| `ahmedgamal22@gmail.com` | doctor | حذف من `public.users` |
| `ahmedgamal21@gmail.com` | doctor | حذف من `public.users` |
| `ahmedgamal@careflow.com` | doctor | حذف من `public.users` |
| `aymantarekm1665656@gmail.com` | patient | حذف من `public.users` |

## حسابات لها Auth + users لكن ينقصها Profile

هذه الحسابات تستطيع تسجيل الدخول، لكن ستظهر لها رسالة "ملف غير مكتمل" لأنها لا تملك صفًا مطابقًا في جدول الدور المناسب.

| الحساب | الدور | المشكلة | الحل |
| --- | --- | --- | --- |
| `alisalah22@gmail.com` | doctor | لا يوجد صف في `doctors` | إنشاء doctor profile أو حذف الحساب |
| `yousseffathy725@gmail.com` | patient | لا يوجد صف في `patients` | إنشاء patient profile أو حذف الحساب |
| `doctossr@careflow.com` | patient | لا يوجد صف في `patients` | إنشاء patient profile أو حذف الحساب |
| `amrtarek12@careflow.com` | patient | لا يوجد صف في `patients` | إنشاء patient profile أو حذف الحساب |
| `ahmed_alaa@careflow.com` | patient | لا يوجد صف في `patients` | إنشاء patient profile أو حذف الحساب |

## ملاحظة عن `ahmedtarek@careflow.com`

وقت المراجعة، الحساب `ahmedtarek@careflow.com` لم يظهر في:

- Supabase Authentication
- `public.users`

إذا كان ما زال يظهر داخل المتصفح أو يستطيع فتح لوحة الطبيب، فغالبًا هذه جلسة قديمة محفوظة في المتصفح.

الإجراء المقترح:

1. تسجيل الخروج من التطبيق.
2. عمل hard refresh.
3. إذا استمرت المشكلة، امسح بيانات الموقع من المتصفح ثم سجل الدخول بحساب موجود فعليًا.

## سبب ظهور "ملف الطبيب غير مكتمل"

لو المستخدم دوره `doctor` في `public.users` لكن لا يوجد له صف في `public.doctors` بالقيمة:

```sql
doctors.user_id = users.id
```

فصفحات الطبيب لن تجد ملف الطبيب وستعرض رسالة أن الملف غير مكتمل.

نفس الفكرة للمرضى:

```sql
patients.user_id = users.id
```

## توصية التنظيف

الأفضل قبل حذف أي حساب:

1. تأكد أنه ليس عليه مواعيد أو سجلات أو وصفات أو فواتير.
2. الحسابات اليتيمة الموجودة في `public.users` فقط يمكن حذفها من `public.users`.
3. الحسابات الموجودة في Auth و`public.users` لكن بلا profile: إما تنشئ لها profile، أو تحذفها من Authentication و`public.users`.

