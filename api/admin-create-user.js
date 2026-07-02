import { createClient } from "@supabase/supabase-js";

const VALID_ROLES = new Set(["admin", "doctor", "patient", "receptionist"]);

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { supabaseUrl, publishableKey, serviceRoleKey };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { supabaseUrl, publishableKey, serviceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return res.status(500).json({ ok: false, message: "Missing Supabase environment variables" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json({ ok: false, message: "Missing authorization token" });
  }

  const { email, password, name, role } = req.body || {};
  if (!email || !password || !name || !VALID_ROLES.has(role)) {
    return res.status(400).json({ ok: false, message: "Invalid user payload" });
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ ok: false, message: "Invalid authorization token" });
  }

  const { data: requester, error: requesterError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (requesterError || requester?.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Admin access required" });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { role },
  });

  if (createError || !created.user) {
    return res.status(400).json({
      ok: false,
      message: createError?.message || "Failed to create auth user",
    });
  }

  const { error: profileError } = await adminClient.from("users").upsert(
    { id: created.user.id, name, email, role },
    { onConflict: "id" },
  );

  if (profileError) {
    return res.status(500).json({
      ok: false,
      message: profileError.message,
      uid: created.user.id,
    });
  }

  return res.status(200).json({ ok: true, uid: created.user.id, profileSynced: true });
}
