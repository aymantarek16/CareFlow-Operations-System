import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import type { NotificationRecord } from "@/lib/types";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileText,
  Info,
  Check,
  Trash2,
  CheckCheck,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/helpers";

function iconFor(type: string) {
  switch (type) {
    case "appointment":
      return <CalendarDays className="h-5 w-5 text-emerald-400" />;
    case "invoice":
      return <CreditCard className="h-5 w-5 text-amber-400" />;
    case "record":
      return <FileText className="h-5 w-5 text-cyan-400" />;
    default:
      return <Info className="h-5 w-5 text-foreground/60" />;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function relatedRouteFor(
  n: NotificationRecord,
  role: string | undefined,
): string | null {
  if (!n.related_id) return null;
  const id = n.related_id;
  switch (n.type) {
    case "appointment":
      if (role === "admin") return `/admin/appointments/${id}`;
      if (role === "doctor") return `/doctor/appointments`;
      if (role === "patient") return `/patient/appointments`;
      if (role === "receptionist") return `/receptionist/appointments`;
      return null;
    case "invoice":
      if (role === "admin") return `/admin/invoices`;
      if (role === "patient") return `/patient/invoices`;
      if (role === "receptionist") return `/receptionist/billing`;
      return null;
    case "record":
      if (role === "doctor") return `/doctor/records`;
      if (role === "patient") return `/patient/records`;
      return null;
    default:
      return null;
  }
}

type Filter = "all" | "unread" | "appointment" | "invoice" | "record";

export default function Notifications() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const { items, unreadCount, markRead, markAllRead, remove, loading } = useNotifications(30_000);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.type === filter);
  }, [items, filter]);

  const chipClass = (value: Filter) =>
    cn(
      "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition",
      filter === value
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-foreground/10 bg-foreground/5 text-foreground/70 hover:bg-foreground/10",
    );

  const onRowClick = async (n: NotificationRecord) => {
    if (!n.read) await markRead(n.id);
    const target = relatedRouteFor(n, appUser?.role);
    if (target) navigate(target);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="الإشعارات"
        description={
          unreadCount > 0
            ? `لديك ${unreadCount} إشعار غير مقروء`
            : "لا توجد إشعارات غير مقروءة"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-foreground/50">
          <Filter className="h-3.5 w-3.5" />
          تصفية:
        </div>
        <button type="button" onClick={() => setFilter("all")} className={chipClass("all")}>
          الكل ({items.length})
        </button>
        <button type="button" onClick={() => setFilter("unread")} className={chipClass("unread")}>
          غير مقروءة ({unreadCount})
        </button>
        <button type="button" onClick={() => setFilter("appointment")} className={chipClass("appointment")}>
          <CalendarDays className="h-3 w-3" />
          مواعيد
        </button>
        <button type="button" onClick={() => setFilter("invoice")} className={chipClass("invoice")}>
          <CreditCard className="h-3 w-3" />
          فواتير
        </button>
        <button type="button" onClick={() => setFilter("record")} className={chipClass("record")}>
          <FileText className="h-3 w-3" />
          سجلات
        </button>

        <div className="ms-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-3 py-2 text-xs font-semibold text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              تعليم الكل كمقروء
            </button>
          )}
        </div>
      </div>

      <GlassCard title={`النتائج (${filtered.length})`} subtitle="آخر 50 إشعار">
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-foreground/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="data"
            title="لا توجد إشعارات"
            description={
              filter === "all"
                ? "لم تتلقَ أي إشعارات بعد"
                : "لا توجد إشعارات مطابقة للتصفية"
            }
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border p-4 transition",
                  n.read
                    ? "border-foreground/10 bg-foreground/[0.02]"
                    : "border-primary/20 bg-primary/5",
                )}
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
                  {iconFor(n.type)}
                </span>
                <button
                  type="button"
                  onClick={() => onRowClick(n)}
                  className="flex flex-1 min-w-0 flex-col gap-1 text-start"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </span>
                  <span className="text-sm text-foreground/70">{n.message}</span>
                  <span className="text-xs text-foreground/40">{formatDateTime(n.created_at)}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      title="تعليم كمقروء"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    title="حذف"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10 text-rose-400 hover:bg-rose-400/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3 text-xs text-foreground/50">
        <Bell className="h-3.5 w-3.5" />
        يتم تحديث الإشعارات تلقائياً كل 30 ثانية.
      </div>
    </div>
  );
}
