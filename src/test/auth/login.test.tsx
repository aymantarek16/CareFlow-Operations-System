/**
 * Login flow tests
 * - Renders login form correctly
 * - Shows error on invalid credentials
 * - Calls signIn and redirects based on role after successful login
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicRoute } from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/Login";
import {
  resetAllMocks,
  mockSignInWithPassword,
  mockGetSession,
  mockFrom,
  buildFakeUser,
  buildFakeSession,
  fireAuthStateChange,
} from "@/test/__mocks__/supabase";

vi.mock("@/lib/supabase", () => import("@/test/__mocks__/supabase"));

function DummyDashboard({ label }: { label: string }) {
  return <div data-testid="dashboard">{label}</div>;
}

function renderLogin(route = "/login") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/admin/dashboard" element={<DummyDashboard label="admin" />} />
            <Route path="/doctor/dashboard" element={<DummyDashboard label="doctor" />} />
            <Route path="/patient/dashboard" element={<DummyDashboard label="patient" />} />
            <Route path="/receptionist/dashboard" element={<DummyDashboard label="receptionist" />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Login Page", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("renders email and password inputs and submit button", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/example@careflow/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تسجيل الدخول/i })).toBeInTheDocument();
  });

  it("shows error message on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/example@careflow/i), {
      target: { value: "wrong@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });
  });

  it("calls signInWithPassword with correct email and password", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/example@careflow/i), {
      target: { value: "admin@careflow.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@careflow.com",
        password: "12345678",
      });
    });
  });

  it.each([
    ["admin", "/admin/dashboard"],
    ["doctor", "/doctor/dashboard"],
    ["patient", "/patient/dashboard"],
    ["receptionist", "/receptionist/dashboard"],
  ] as const)("redirects %s to %s after successful login", async (role, _expectedPath) => {
    const fakeUser = buildFakeUser({ id: `${role}-uuid`, email: `${role}@careflow.com`, role: role as any });
    const fakeSession = buildFakeSession(fakeUser);

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });

    // DB query fails (RLS) — fallback to metadata
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "infinite recursion" } }),
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/example@careflow/i), {
      target: { value: `${role}@careflow.com` },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled();
    });

    // Simulate the auth state change that Supabase fires after login
    await act(async () => {
      fireAuthStateChange("SIGNED_IN", fakeSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toHaveTextContent(role);
    });
  });
});
