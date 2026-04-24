import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { NotificationRecord } from "@/lib/types";

/**
 * Notifications hook with interval polling.
 *
 * Fetches the signed-in user's notifications (newest first) and refreshes
 * automatically every `pollMs` ms (default 30s — no realtime subscription).
 */
export function useNotifications(pollMs: number = 30_000) {
  const { appUser } = useAuth();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchNow = useCallback(async () => {
    if (!appUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", appUser.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (mounted.current) {
        setItems((data ?? []) as NotificationRecord[]);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "error");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    mounted.current = true;
    fetchNow();
    if (!appUser) return;
    const id = window.setInterval(fetchNow, pollMs);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [fetchNow, appUser, pollMs]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    if (!appUser) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", appUser.id)
      .eq("read", false);
  }, [appUser]);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return {
    items,
    loading,
    error,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    refetch: fetchNow,
  };
}
