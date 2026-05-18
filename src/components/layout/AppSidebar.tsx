import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CreditCard,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Stethoscope,
  Users,
  ClipboardCheck,
  BarChart3,
  Clock,
  Settings,
  PlusCircle,
  Pill,
  LogOut,
  Menu,
  Building2,
  UserCog,
  Database,
} from "lucide-react";
import type { AppRole, AppUser } from "@/lib/types";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { cn, getInitials } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV: Record<AppRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { href: "/admin/dashboard", label: "مركز القيادة", icon: LayoutDashboard },
    { href: "/admin/patients", label: "ملفات المرضى", icon: Users },
    { href: "/admin/doctors", label: "طاقم الأطباء", icon: Stethoscope },
    { href: "/admin/staff", label: "الموظفون والإدارة", icon: UserCog },
    { href: "/admin/departments", label: "الأقسام والتخصصات", icon: Building2 },
    { href: "/admin/appointments", label: "إدارة المواعيد", icon: CalendarDays },
    { href: "/admin/invoices", label: "الفواتير والمدفوعات", icon: CreditCard },
    { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
    { href: "/admin/activity", label: "سجل النشاط", icon: Clock },
    { href: "/admin/backup", label: "النسخ الاحتياطي", icon: Database },
    { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "ملخص الطبيب", icon: LayoutDashboard },
    { href: "/doctor/appointments", label: "قائمة المواعيد", icon: CalendarDays },
    { href: "/doctor/patients", label: "المرضى المرتبطون", icon: Users },
    { href: "/doctor/records", label: "السجلات الطبية", icon: FileText },
    { href: "/doctor/prescriptions", label: "الوصفات الطبية", icon: Pill },
  ],
  patient: [
    { href: "/patient/dashboard", label: "ملخص الحساب", icon: LayoutDashboard },
    { href: "/patient/appointments", label: "جدول الزيارات", icon: CalendarDays },
    { href: "/patient/book-appointment", label: "حجز موعد", icon: PlusCircle },
    { href: "/patient/records", label: "السجل الطبي", icon: FileText },
    { href: "/patient/invoices", label: "المدفوعات", icon: CreditCard },
    { href: "/patient/profile", label: "الملف الشخصي", icon: HeartPulse },
  ],
  receptionist: [
    { href: "/receptionist/dashboard", label: "مركز الاستقبال", icon: LayoutDashboard },
    { href: "/receptionist/patients", label: "إدارة المرضى", icon: Users },
    { href: "/receptionist/appointments", label: "إدارة المواعيد", icon: CalendarDays },
    { href: "/receptionist/check-in", label: "تسجيل الحضور", icon: ClipboardCheck },
    { href: "/receptionist/billing", label: "الفواتير", icon: CreditCard },
  ],
};

function SidebarContent({
  user,
  closeOnSelect = false,
  className,
}: {
  user: AppUser;
  closeOnSelect?: boolean;
  className?: string;
}) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navItems = NAV[user.role] ?? [];

  return (
    <div className={cn("h-full overflow-y-auto p-5 pe-3 [scrollbar-gutter:stable]", className)}>
      {/* Brand */}
      <div className="relative overflow-hidden rounded-[28px] border border-foreground/10 bg-foreground/[0.03] p-5">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground">CareFlow</h1>
            <p className="mt-2 text-sm leading-7 text-foreground/55">لإدارة العيادات والمراكز الطبية</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl">
            <img src="/careflow.png" alt="CareFlow" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="mt-5 flex items-center gap-3 rounded-[28px] border border-foreground/10 bg-background/50 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-base font-black text-background">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-sm text-foreground/45">{user.email}</p>
          <div className="mt-2">
            <RoleBadge role={user.role} />
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Nav */}
      <nav className="mt-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const navLink = (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "border border-primary/25 bg-primary/12 text-foreground shadow-[0_0_0_1px_rgba(52,211,153,0.08)]"
                  : "border border-transparent text-foreground/68 hover:border-foreground/8 hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border",
                  isActive
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-foreground/8 bg-foreground/[0.03] text-foreground/55 group-hover:text-foreground"
                )}
              >
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </Link>
          );

          return closeOnSelect ? (
            <SheetClose asChild key={item.href}>
              {navLink}
            </SheetClose>
          ) : (
            navLink
          );
        })}
      </nav>

      {/* Sign out */}
      {closeOnSelect ? (
        <SheetClose asChild>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-foreground/50 transition hover:border-rose-400/20 hover:bg-rose-400/5 hover:text-rose-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/8 bg-foreground/[0.03]">
              <LogOut size={18} />
            </span>
            <span>تسجيل الخروج</span>
          </button>
        </SheetClose>
      ) : (
        <button
          type="button"
          onClick={signOut}
          className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-foreground/50 transition hover:border-rose-400/20 hover:bg-rose-400/5 hover:text-rose-300"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/8 bg-foreground/[0.03]">
            <LogOut size={18} />
          </span>
          <span>تسجيل الخروج</span>
        </button>
      )}
    </div>
  );
}

export function AppSidebar({ user }: { user: AppUser }) {
  return (
    <aside className="panel sticky top-5 hidden h-[calc(100vh-2.5rem)] overflow-hidden rounded-[34px] xl:block">
      <SidebarContent user={user} />
    </aside>
  );
}

export function MobileSidebar({ user }: { user: AppUser }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setOpen(false);
    };

    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="mb-4 xl:hidden">
      <div className="panel flex items-center justify-between gap-3 rounded-[28px] p-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/careflow.png" alt="CareFlow" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="truncate text-base font-black text-foreground">CareFlow</p>
            <p className="truncate text-xs font-medium text-foreground/55">{user.name}</p>
          </div>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground hover:bg-foreground/10 hover:text-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="panel h-dvh w-[90vw] max-w-[380px] overflow-hidden border-y-0 border-l border-r-0 border-foreground/10 bg-background/95 p-0 sm:w-[380px] sm:max-w-[380px] xl:hidden"
          >
            <SheetTitle className="sr-only">CareFlow navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Mobile and tablet navigation drawer for CareFlow dashboards.
            </SheetDescription>
            <SidebarContent user={user} closeOnSelect className="pt-12" />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
