/**
 * Supabase mock for unit tests.
 * Every method returns a chainable query builder by default.
 * Tests can override return values via mockResolvedValue / mockReturnValue.
 */
import { vi } from "vitest";
import type { User, Session } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/types";

/* ── helpers to build fake auth objects ── */

let _onAuthStateChangeCb: ((event: string, session: Session | null) => void) | null = null;

export function buildFakeUser(overrides: Partial<User> & { role?: AppRole } = {}): User {
  const role = overrides.role ?? "patient";
  return {
    id: overrides.id ?? "user-uuid-1",
    aud: "authenticated",
    role: "authenticated",
    email: overrides.email ?? "test@careflow.com",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: overrides.user_metadata?.name ?? "Test User", role },
    identities: [],
    factors: [],
  } as unknown as User;
}

export function buildFakeSession(user: User): Session {
  return {
    access_token: "fake-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "fake-refresh-token",
    user,
  } as Session;
}

/* ── chainable query builder mock ── */

function createQueryBuilder(resolvedData: { data: unknown; error: unknown } = { data: [], error: null }) {
  const builder: Record<string, any> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "neq", "in", "is", "order", "limit", "range", "single", "maybeSingle", "filter"];
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  // Terminal — returns the promise
  builder.then = (resolve: any) => resolve(resolvedData);
  // Allow overriding resolved data
  builder._resolve = (d: any) => {
    resolvedData = d;
    return builder;
  };
  return builder;
}

/* ── main mock ── */

export const mockSignInWithPassword = vi.fn();
export const mockSignUp = vi.fn();
export const mockSignOut = vi.fn();
export const mockGetSession = vi.fn();
export const mockOnAuthStateChange = vi.fn();
export const mockFrom = vi.fn();

/** Simulates an auth state change event (call in tests to trigger redirect logic) */
export function fireAuthStateChange(event: string, session: Session | null) {
  _onAuthStateChangeCb?.(event, session);
}

export function resetAllMocks() {
  mockSignInWithPassword.mockReset();
  mockSignUp.mockReset();
  mockSignOut.mockReset();
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockFrom.mockReset();
  _onAuthStateChangeCb = null;

  // Defaults
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockOnAuthStateChange.mockImplementation((cb: any) => {
    _onAuthStateChangeCb = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mockSignOut.mockResolvedValue({ error: null });
  mockFrom.mockReturnValue(createQueryBuilder());
}

export const supabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: mockFrom,
};
