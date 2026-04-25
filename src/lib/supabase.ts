import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client.
 *
 * The URL and *anon* (publishable) key are designed by Supabase to be
 * safe in front-end bundles — Row Level Security at the database layer
 * is what enforces who can read/write what. We read them from Vite's
 * `import.meta.env` so each deployment can target its own project, and
 * fall back to the production project only if no env var is set (so
 * local dev keeps working without extra setup).
 *
 * ⚠️ Do NOT put the `service_role` key here or anywhere in `src/`.
 * That key bypasses RLS and must only ever live on a trusted server.
 */
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://psnwjxefwsxtvllpljhq.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "sb_publishable_UFuimqKJeseyxKENKkGFxw_URKPunDq";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loudly during development if env vars are explicitly cleared.
  // We deliberately do NOT log the actual values.
  throw new Error("Supabase configuration is missing");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use PKCE so the OAuth/magic-link flow doesn't expose tokens in URLs.
    flowType: "pkce",
  },
  global: {
    headers: {
      "x-client-info": "careflow-web",
    },
  },
});
