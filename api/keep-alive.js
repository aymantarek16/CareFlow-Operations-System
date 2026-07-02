import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        ok: false,
        message: "Missing Supabase environment variables",
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseKey),
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // اقرأ قيمة ping_count الحالية
    const { data, error: fetchError } = await supabase
      .from("system_heartbeat")
      .select("ping_count")
      .eq("id", 1)
      .single();

    if (fetchError) {
      return res.status(500).json({
        ok: false,
        message: "Failed to read heartbeat",
        error: fetchError.message,
      });
    }

    // حدث آخر Ping وزود العداد
    const { error: updateError } = await supabase
      .from("system_heartbeat")
      .update({
        last_ping: new Date().toISOString(),
        ping_count: (data?.ping_count ?? 0) + 1,
      })
      .eq("id", 1);

    if (updateError) {
      return res.status(500).json({
        ok: false,
        message: "Failed to update heartbeat",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "CareFlow heartbeat updated successfully",
      ping_count: (data?.ping_count ?? 0) + 1,
      time: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Unexpected error",
      error: error.message,
    });
  }
}