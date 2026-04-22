import { Bell, Sparkles, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { AppRole } from "@/lib/types";
import { cn, getInitials } from "@/lib/helpers";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { CalendarDays, CreditCard, FileText, HeartPulse, LayoutDashboard, ShieldCheck, Stethoscope, Users, ClipboardCheck, BarChart3, Clock, Settings, PlusCircle, Pill } from "lucide-react";

const NAV: Record<AppRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { href: "/admin/dashboard", label: "مركز القيادة", icon: LayoutDashboard },
    { href: "/admin/patients", label: "ملفات المرضى", icon: Users },
    { href: "/admin/doctors", label: "طاقم الأطباء", icon: Stethoscope },
    { href: "/admin/appointments", label: "إدارة المواعيد", icon: CalendarDays },
    { href: "/admin/invoices", label: "الفواتير", icon: CreditCard },
    { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
    { href: "/admin/activity", label: "سجل النشاط", icon: Clock },
    { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "ملخص الطبيب", icon: LayoutDashboard },
    { href: "/doctor/appointments", label: "المواعيد", icon: CalendarDays },
    { href: "/doctor/patients", label: "المرضى", icon: Users },
    { href: "/doctor/records", label: "السجلات", icon: FileText },
    { href: "/doctor/prescriptions", label: "الوصفات", icon: Pill },
  ],
  patient: [
    { href: "/patient/dashboard", label: "ملخصي", icon: LayoutDashboard },
    { href: "/patient/appointments", label: "مواعيدي", icon: CalendarDays },
    { href: "/patient/book-appointment", label: "حجز موعد", icon: PlusCircle },
    { href: "/patient/records", label: "سجلي الطبي", icon: FileText },
    { href: "/patient/invoices", label: "المدفوعات", icon: CreditCard },
    { href: "/patient/profile", label: "ملفي", icon: HeartPulse },
  ],
  receptionist: [
    { href: "/receptionist/dashboard", label: "الاستقبال", icon: LayoutDashboard },
    { href: "/receptionist/patients", label: "المرضى", icon: Users },
    { href: "/receptionist/appointments", label: "المواعيد", icon: CalendarDays },
    { href: "/receptionist/check-in", label: "تسجيل الحضور", icon: ClipboardCheck },
    { href: "/receptionist/billing", label: "الفواتير", icon: CreditCard },
  ],
};

export function Topbar() {
  const { appUser, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navItems = appUser ? NAV[appUser.role] ?? [] : [];

  const now = new Intl.DateTimeFormat("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date());

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
            <Menu size={20} />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-xs uppercase tracking-[0.24em] text-primary/70">
              <Sparkles size={12} />
              Production ready
            </div>
            <p className="mt-2 text-sm text-foreground/48">{now}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 text-sm text-foreground/60">
            <Bell size={17} className="text-amber-300" />
            صفر أعطال حرجة
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && appUser && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-80 overflow-y-auto panel p-5">
            <div className="flex items-center gap-4 rounded-[28px] border border-foreground/10 bg-background/50 p-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-black text-background">
                {getInitials(appUser.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground text-sm">{appUser.name}</p>
                <RoleBadge role={appUser.role} />
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                    className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive ? "bg-primary/12 text-foreground" : "text-foreground/60 hover:bg-foreground/[0.04]"
                    )}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button onClick={() => { signOut(); setMobileOpen(false); }} className="mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-400/5">
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
