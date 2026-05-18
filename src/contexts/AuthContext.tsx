import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppUser, AppRole } from "@/lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: AppRole }>;
  signUp: (email: string, password: string, meta: Record<string, string>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Determine role from trusted database state only. */
function resolveRole(user: User): AppRole {
  // User metadata is controlled by the signed-in user, so it is never used
  // for authorization. If the DB profile cannot be read, fail closed.
  void user;
  return "patient";
}

function buildAppUserFromAuth(user: User): AppUser {
  const role = resolveRole(user);
  const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  return { id: user.id, name, email: user.email ?? "", role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (authUser: User): Promise<AppUser> => {
    // Try DB first with a timeout
    try {
      const result = await Promise.race([
        supabase
          .from("users")
          .select("id, name, email, role, created_at")
          .eq("id", authUser.id)
          .single(),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 3000)
        ),
      ]);

      if (!result.error && result.data) {
        const appUserData = result.data as AppUser;
        setAppUser(appUserData);
        return appUserData;
      }
    } catch {
      // DB query failed — use fallback
    }

    // Fallback to auth metadata + email mapping
    const fallback = buildAppUserFromAuth(authUser);
    setAppUser(fallback);
    return fallback;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAppUser(session.user).finally(() => setLoading(false));
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Immediately resolve role so caller can navigate
    if (data.user) {
      const appUserResult = await fetchAppUser(data.user);
      return { error: null, role: appUserResult.role };
    }
    return { error: null };
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
