import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/types";
import { routeByRole } from "@/lib/helpers";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: AppRole[] }) {
  const { appUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles && !allowedRoles.includes(appUser.role)) {
    return <Navigate to={routeByRole(appUser.role)} replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (appUser) return <Navigate to={routeByRole(appUser.role)} replace />;

  return <>{children}</>;
}
