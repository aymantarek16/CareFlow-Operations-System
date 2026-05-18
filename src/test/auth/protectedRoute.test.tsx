/**
 * Route protection tests
 * - ProtectedRoute redirects to /login when not authenticated
 * - ProtectedRoute redirects to correct dashboard when role mismatch
 * - PublicRoute redirects authenticated users to their dashboard
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import type { AppRole } from "@/lib/types";
import {
  resetAllMocks,
  mockGetSession,
  buildFakeUser,
  buildFakeSession,
  mockFrom,
} from "@/test/__mocks__/supabase";

vi.mock("@/lib/supabase", () => import("@/test/__mocks__/supabase"));

function renderWithRoutes(initialRoute: string, routes: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>{routes}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("redirects unauthenticated users to /login", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    renderWithRoutes(
      "/admin/dashboard",
      <Routes>
        <Route path="/login" element={<div data-testid="login">login</div>} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <div data-testid="admin">admin</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByTestId("login")).toBeInTheDocument();
    });
  });

  it("redirects to correct dashboard when role does not match", async () => {
    const doctorUser = buildFakeUser({ role: "doctor" });
    const session = buildFakeSession(doctorUser);
    mockGetSession.mockResolvedValue({ data: { session }, error: null });

    // DB fetch falls back to metadata
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "rls" } }),
    });

    renderWithRoutes(
      "/admin/dashboard",
      <Routes>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <div data-testid="admin">admin</div>
            </ProtectedRoute>
          }
        />
        <Route path="/doctor/dashboard" element={<div data-testid="doctor-dash">doctor</div>} />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByTestId("doctor-dash")).toBeInTheDocument();
    });
  });

  it("allows access when role matches", async () => {
    const adminUser = buildFakeUser({ role: "admin" });
    const session = buildFakeSession(adminUser);
    mockGetSession.mockResolvedValue({ data: { session }, error: null });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: adminUser.id, name: "Admin", email: "admin@careflow.com", role: "admin" },
        error: null,
      }),
    });

    renderWithRoutes(
      "/admin/dashboard",
      <Routes>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <div data-testid="admin-content">admin content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    });
  });
});

describe("PublicRoute", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("renders children when user is not authenticated", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    renderWithRoutes(
      "/login",
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div data-testid="login-form">login form</div>
            </PublicRoute>
          }
        />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });

  it.each([
    ["admin", "/admin/dashboard"],
    ["doctor", "/doctor/dashboard"],
    ["patient", "/patient/dashboard"],
    ["receptionist", "/receptionist/dashboard"],
  ] as const)("redirects authenticated %s to %s", async (role, path) => {
    const user = buildFakeUser({ role: role as AppRole });
    const session = buildFakeSession(user);
    mockGetSession.mockResolvedValue({ data: { session }, error: null });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: user.id, name: "User", email: user.email, role },
        error: null,
      }),
    });

    renderWithRoutes(
      "/login",
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div data-testid="login-form">login</div>
            </PublicRoute>
          }
        />
        <Route path={path} element={<div data-testid={`${role}-dash`}>{role}</div>} />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`${role}-dash`)).toBeInTheDocument();
    });
  });
});
