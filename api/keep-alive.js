import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        ok: false,
        message: "Missing Supabase environment variables",
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseAnonKey),
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase
      .from("activity_logs")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        ok: false,
        message: "Supabase ping failed",
        table: "activity_logs",
        error: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "CareFlow is alive",
      table: "activity_logs",
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