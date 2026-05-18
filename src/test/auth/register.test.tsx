/**
 * Registration flow tests
 * - Renders registration form
 * - Calls signUp + inserts into users + patients tables
 * - Shows error if signup fails
 * - Shows error if profile insert fails
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import RegisterPage from "@/pages/Register";
import {
  resetAllMocks,
  mockSignUp,
  mockSignInWithPassword,
  mockFrom,
  buildFakeUser,
} from "@/test/__mocks__/supabase";

vi.mock("@/lib/supabase", () => import("@/test/__mocks__/supabase"));

function renderRegister() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/register"]}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<div data-testid="login-page">login</div>} />
            <Route path="/patient/dashboard" element={<div data-testid="patient-dash">dash</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText("الاسم بالكامل"), { target: { value: "أحمد محمد" } });
  fireEvent.change(screen.getByPlaceholderText("البريد الإلكتروني"), { target: { value: "ahmed@test.com" } });
  fireEvent.change(screen.getByPlaceholderText(/كلمة المرور/), { target: { value: "password123" } });
  fireEvent.change(screen.getByPlaceholderText("الهاتف"), { target: { value: "0501234567" } });
  // Fill the required date input
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  if (dateInput) fireEvent.change(dateInput, { target: { value: "1990-01-15" } });
}

describe("Register Page", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("renders all required form fields", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("الاسم بالكامل")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("البريد الإلكتروني")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/كلمة المرور/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("الهاتف")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إنشاء حساب/i })).toBeInTheDocument();
  });

  it("shows error when signUp fails", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /إنشاء حساب/i }));

    await waitFor(() => {
      expect(screen.getByText("هذه البيانات مستخدمة بالفعل.")).toBeInTheDocument();
    });
  });

  it("calls signUp then inserts into users and patients tables on success", async () => {
    const fakeUser = buildFakeUser({ id: "new-user-id", email: "ahmed@test.com", role: "patient" });

    mockSignUp.mockResolvedValueOnce({
      data: { user: fakeUser, session: null },
      error: null,
    });

    // Track inserts — users table then patients table
    const insertCalls: { table: string; data: unknown }[] = [];
    mockFrom.mockImplementation((table: string) => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
        insert: vi.fn().mockImplementation((data: unknown) => {
          insertCalls.push({ table, data });
          return Promise.resolve({ data: null, error: null });
        }),
      };
      return builder;
    });

    // signIn after registration
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: fakeUser, session: null },
      error: null,
    });

    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /إنشاء حساب/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "ahmed@test.com",
        password: "password123",
        options: { data: { name: "أحمد محمد", role: "patient" } },
      });
    });

    await waitFor(() => {
      // Verify both inserts happened
      const usersInsert = insertCalls.find((c) => c.table === "users");
      const patientsInsert = insertCalls.find((c) => c.table === "patients");

      expect(usersInsert).toBeDefined();
      expect(usersInsert!.data).toMatchObject({
        id: "new-user-id",
        name: "أحمد محمد",
        email: "ahmed@test.com",
        role: "patient",
      });

      expect(patientsInsert).toBeDefined();
      expect(patientsInsert!.data).toMatchObject({
        user_id: "new-user-id",
        first_name: "أحمد",
        last_name: "محمد",
        phone: "0501234567",
        gender: "male",
      });
    });
  });

  it("shows error when users table insert fails", async () => {
    const fakeUser = buildFakeUser({ id: "fail-user-id" });

    mockSignUp.mockResolvedValueOnce({
      data: { user: fakeUser, session: null },
      error: null,
    });

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "rls" } }),
      insert: vi.fn().mockResolvedValue({ data: null, error: { message: "RLS policy violation" } }),
    }));

    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /إنشاء حساب/i }));

    await waitFor(() => {
      expect(screen.getByText("ليست لديك الصلاحية للقيام بهذه العملية.")).toBeInTheDocument();
    });
  });
});
