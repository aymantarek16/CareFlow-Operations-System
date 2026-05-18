-- ============================================================
-- CareFlow — Step 7: Let admins insert users on behalf of others
-- ============================================================
-- مشكلة:
--   لما الادمن بيعمل حساب لطبيب/مريض/موظف من اللوحة، الفرونت
--   بيستدعي supabase.auth.signUp اللي بيبدّل الـ session محلياً
--   للمستخدم الجديد ثم بيعمل insert في جدول users باسمه.
--   الفرونت الجديد بقى بيرجّع session الادمن قبل الـ insert
--   (انظر src/lib/adminAuth.ts)، لكن policy users_insert_self
--   القديمة بتسمح فقط بـ id = auth.uid() — فلازم نسمح للادمن
--   يضيف users باسماء آخرين.
--
--   patients_insert كان فيه مسار admin/receptionist أصلاً.
--   doctors_insert كان فيه is_admin() أصلاً.
--   users هي اللي كانت ناقصة.
--
-- شغّل الملف دا مرة واحدة في Supabase SQL Editor.
-- ============================================================

drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin on public.users
  for insert to authenticated
  with check ((select public.is_admin()));
