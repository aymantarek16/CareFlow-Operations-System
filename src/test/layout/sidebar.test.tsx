import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppSidebar, MobileSidebar } from "@/components/layout/AppSidebar";
import type { AppUser } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signOut: mocks.signOut,
  }),
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <button type="button" aria-label="notifications" />,
}));

const adminUser: AppUser = {
  id: "admin-test",
  name: "Admin User",
  email: "admin@careflow.com",
  role: "admin",
};

function renderInRouter(element: React.ReactElement, route = "/admin/dashboard") {
  return render(<MemoryRouter initialEntries={[route]}>{element}</MemoryRouter>);
}

describe("responsive sidebar", () => {
  beforeEach(() => {
    mocks.signOut.mockClear();
  });

  it("keeps the desktop sidebar path visible only at the desktop breakpoint", () => {
    const { container } = renderInRouter(<AppSidebar user={adminUser} />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden", "xl:block", "h-[calc(100vh-2.5rem)]", "rounded-[34px]");
    expect(screen.queryByRole("button", { name: "Open navigation menu" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /مركز القيادة/ })).toHaveClass("bg-primary/12");
  });

  it("opens admin navigation inside the mobile and tablet drawer", async () => {
    const { container } = renderInRouter(<MobileSidebar user={adminUser} />);

    expect(container.firstElementChild).toHaveClass("xl:hidden");

    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /مركز القيادة/ })).toHaveClass("bg-primary/12");
    expect(screen.getByRole("link", { name: /ملفات المرضى/ })).toHaveAttribute("href", "/admin/patients");
  });
});
