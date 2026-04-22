export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") || "-" };
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
  } catch { return d; }
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return "-";
  try {
    const [h, m] = t.split(":");
    const date = new Date();
    date.setHours(Number(h), Number(m));
    return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(date);
  } catch { return t; }
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  } catch { return d; }
}

export function formatAppointmentStatus(s: string | null | undefined): string {
  const map: Record<string, string> = {
    scheduled: "مجدول",
    "checked-in": "تم التسجيل",
    "in-progress": "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغى",
    "no-show": "لم يحضر",
    no_show: "لم يحضر",
  };
  return map[s ?? ""] ?? s ?? "غير محدد";
}

export function formatRole(r: string | null | undefined): string {
  const map: Record<string, string> = { admin: "مدير", doctor: "طبيب", patient: "مريض", receptionist: "موظف استقبال" };
  return map[r ?? ""] ?? r ?? "غير محدد";
}

export function routeByRole(role: string): string {
  switch (role) {
    case "admin": return "/admin/dashboard";
    case "doctor": return "/doctor/dashboard";
    case "patient": return "/patient/dashboard";
    case "receptionist": return "/receptionist/dashboard";
    default: return "/login";
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
