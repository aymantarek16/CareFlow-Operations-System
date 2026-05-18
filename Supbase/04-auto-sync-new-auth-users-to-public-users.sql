-- ============================================================
-- CareFlow — Step 3: Auto-sync trigger (auth.users -> public.users)
-- ============================================================
-- لما أي حد يعمل signup (من Register.tsx أو من الـ Dashboard)،
-- الـ trigger ده هيعمل row تلقائي في public.users.
-- بيشتغل بـ SECURITY DEFINER علشان يتخطى الـ RLS.
-- بيستعمل ON CONFLICT DO NOTHING علشان ميكسرش Register.tsx
-- اللي بيعمل insert يدوي لنفس الـ row.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  user_name text;
begin
  -- 1) الدور: لا نثق في raw_user_meta_data لأنه قابل للتعديل من المستخدم.
  --    الحسابات العامة تبدأ patient، وأي دور أعلى يثبته admin من public.users
  --    أو من raw_app_meta_data الموثوق فقط.
  user_role := coalesce(
    case
      when new.raw_app_meta_data->>'role' in ('admin','doctor','patient','receptionist')
        then new.raw_app_meta_data->>'role'
      else null
    end,
    'patient'
  );

  -- 2) الاسم: من metadata.name أو full_name أو من الإيميل
  user_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1)
  );

  -- 3) Insert مع ON CONFLICT حماية من الـ duplicate
  insert into public.users (id, email, name, role)
  values (new.id, new.email, user_name, user_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ربط الـ trigger بجدول auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
