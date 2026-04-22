import { Link, useLocation } from "react-router-dom";
import { CalendarDays, CreditCard, FileText, HeartPulse, LayoutDashboard, ShieldCheck, Stethoscope, Users, ClipboardCheck, BarChart3, Clock, Settings, PlusCircle, Pill, LogOut } from "lucide-react";
import type { AppRole, AppUser } from "@/lib/types";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { cn, getInitials } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";

const NAV: Record<AppRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { href: "/admin/dashboard", label: "مركز القيادة", icon: LayoutDashboard },
    { href: "/admin/patients", label: "ملفات المرضى", icon: Users },
    { href: "/admin/doctors", label: "طاقم الأطباء", icon: Stethoscope },
    { href: "/admin/appointments", label: "إدارة المواعيد", icon: CalendarDays },
    { href: "/admin/invoices", label: "الفواتير والمدفوعات", icon: CreditCard },
    { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
    { href: "/admin/activity", label: "سجل النشاط", icon: Clock },
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

export function AppSidebar({ user }: { user: AppUser }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navItems = NAV[user.role] ?? [];

  return (
    <aside className="panel sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto rounded-[34px] p-5 hidden lg:block">
      {/* Brand */}
      <div className="relative overflow-hidden rounded-[28px] border border-foreground/10 bg-foreground/[0.03] p-5">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.36em] text-primary/70">CareFlow Prime</p>
            <h1 className="mt-2 text-2xl font-black text-foreground">Medical Ops</h1>
            <p className="mt-2 text-sm leading-7 text-foreground/55">منصة تشغيل طبية متكاملة</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="mt-5 flex items-center gap-4 rounded-[28px] border border-foreground/10 bg-background/50 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-base font-black text-background">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-sm text-foreground/45">{user.email}</p>
          <div className="mt-2"><RoleBadge role={user.role} /></div>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
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
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border", isActive ? "border-primary/20 bg-primary/10 text-primary" : "border-foreground/8 bg-foreground/[0.03] text-foreground/55 group-hover:text-foreground")}>
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-foreground/50 transition hover:border-rose-400/20 hover:bg-rose-400/5 hover:text-rose-300"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/8 bg-foreground/[0.03]">
          <LogOut size={18} />
        </span>
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  );
}
