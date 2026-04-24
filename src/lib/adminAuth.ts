import { supabase } from "@/lib/supabase";

/**
 * Provision a new auth user from an admin-controlled screen.
 *
 * `supabase.auth.signUp` is a client-side call, so after it succeeds the
 * local Supabase session is **replaced** by the freshly created user's
 * session. That has two bad side-effects on admin pages:
 *
 *   1. The admin is silently logged out and any subsequent RLS-protected
 *      inserts (e.g. into `public.doctors`, which requires `is_admin()`)
 *      will fail because `auth.uid()` is now the new user.
 *   2. After the operation the admin is stranded as the wrong identity
 *      and has to log in again.
 *
 * This helper saves the admin's session tokens *before* `signUp`, runs
 * the sign-up, then immediately calls `supabase.auth.setSession` to
 * restore the original admin identity. Subsequent inserts then run with
 * admin privileges as expected.
 *
 * Returns the new user's UUID on success, or `null` if sign-up failed
 * (the caller gets the error via the `error` field).
 */
export async function createUserAsAdmin({
  email,
  password,
  name,
  role,
}: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "doctor" | "patient" | "receptionist";
}): Promise<{ uid: string | null; error: string | null }> {
  // 1. Snapshot the admin session so we can put it back.
  const {
    data: { session: adminSession },
  } = await supabase.auth.getSession();

  // 2. Create the new auth user (this switches the client session).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  // 3. Restore the admin session no matter what — even on failure, so the
  //    admin stays signed in.
  if (adminSession) {
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    });
  }

  if (error) return { uid: null, error: error.message };
  if (!data.user) return { uid: null, error: "لم يتم إنشاء المستخدم" };
  return { uid: data.user.id, error: null };
}
