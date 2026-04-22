import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://psnwjxefwsxtvllpljhq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UFuimqKJeseyxKENKkGFxw_URKPunDq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
