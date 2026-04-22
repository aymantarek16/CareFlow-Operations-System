import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";

export function DashboardLayout() {
  const { appUser } = useAuth();

  if (!appUser) return null;

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto grid max-w-[1880px] gap-6 lg:grid-cols-[320px,1fr]">
        <AppSidebar user={appUser} />
        <div className="min-w-0">
          <Topbar />
          <Outlet />
        </div>
      </div>
    </main>
  );
}
