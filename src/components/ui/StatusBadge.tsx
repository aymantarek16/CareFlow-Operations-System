import { cn, formatAppointmentStatus, formatRole } from "@/lib/helpers";

export function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    scheduled: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    "checked-in": "border-amber-400/20 bg-amber-400/10 text-amber-300",
    "in-progress": "border-violet-400/20 bg-violet-400/10 text-violet-300",
    completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    cancelled: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    no_show: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    "no-show": "border-amber-400/20 bg-amber-400/10 text-amber-300",
    pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    paid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    overdue: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", map[status ?? ""] ?? "border-foreground/10 bg-foreground/5 text-foreground/75")}>
      {formatAppointmentStatus(status)}
    </span>
  );
}

export function RoleBadge({ role }: { role?: string | null }) {
  const map: Record<string, string> = {
    admin: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    doctor: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    patient: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    receptionist: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", map[role ?? ""] ?? "border-foreground/10 bg-foreground/5 text-foreground/75")}>
      {formatRole(role)}
    </span>
  );
}
