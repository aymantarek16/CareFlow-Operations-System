import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppUser, AppRole } from "@/lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: Record<string, string>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Build an AppUser from the users table row, or fall back to auth metadata */
function buildAppUserFromAuth(user: User): AppUser {
  const meta = user.user_metadata ?? {};
  const role: AppRole = meta.role ?? "patient";
  const name = meta.name ?? meta.full_name ?? user.email?.split("@")[0] ?? "User";
  return {
    id: user.id,
    name,
    email: user.email ?? "",
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .eq("id", authUser.id)
        .single();

      if (error || !data) {
        // RLS or missing row — fall back to auth metadata
        console.warn("Could not fetch users row, using auth metadata:", error?.message);
        setAppUser(buildAppUserFromAuth(authUser));
      } else {
        setAppUser(data as AppUser);
      }
    } catch {
      setAppUser(buildAppUserFromAuth(authUser));
    }
  };

  useEffect(() => {
    // 1. Listen for auth changes — no await inside callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // fire-and-forget to avoid blocking the listener
        fetchAppUser(session.user);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    // 2. Restore session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAppUser(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, meta: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, appUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
