import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, CreditCard, FileText, Info, Check, Trash2, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import type { NotificationRecord } from "@/lib/types";
import { cn } from "@/lib/helpers";

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar");
}

function iconFor(type: string) {
  switch (type) {
    case "appointment":
      return <CalendarDays className="h-4 w-4 text-emerald-400" />;
    case "invoice":
      return <CreditCard className="h-4 w-4 text-amber-400" />;
    case "record":
      return <FileText className="h-4 w-4 text-cyan-400" />;
    default:
      return <Info className="h-4 w-4 text-foreground/60" />;
  }
}

function relatedRouteFor(
  notification: NotificationRecord,
  role: string | undefined,
): string | null {
  if (!notification.related_id) return null;
  const id = notification.related_id;
  switch (notification.type) {
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
      if (role === "admin") return null;
      return null;
    default:
      return null;
  }
}

export function NotificationBell() {
  const { appUser } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const { items, unreadCount, markRead, markAllRead, remove, loading } = useNotifications(30_000);

  useEscapeClose(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const panel = panelRef.current;
      const btn = buttonRef.current;
      const target = e.target as Node;
      if (panel && !panel.contains(target) && btn && !btn.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const onItemClick = async (n: NotificationRecord) => {
    if (!n.read) await markRead(n.id);
    const target = relatedRouteFor(n, appUser?.role);
    if (target) {
      setOpen(false);
      navigate(target);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/80 transition hover:bg-foreground/10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute end-0 top-full z-50 mt-2 flex max-h-[520px] w-[360px] flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-[#0b1f19] shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-foreground/10 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">الإشعارات</h3>
              <p className="mt-0.5 text-xs text-foreground/50">
                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "لا إشعارات جديدة"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20"
                title="تعليم الكل كمقروء"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                الكل
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-6 text-center text-xs text-foreground/50">جار التحميل...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-foreground/20" />
                <p className="mt-2 text-xs text-foreground/50">لا توجد إشعارات</p>
              </div>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {items.slice(0, 15).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "group relative flex gap-3 px-4 py-3 transition hover:bg-foreground/[0.03]",
                      !n.read && "bg-primary/[0.04]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className="flex flex-1 items-start gap-3 text-start"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
                        {iconFor(n.type)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-foreground/60">{n.message}</span>
                        <span className="mt-1 block text-[10px] text-foreground/40">{formatRelative(n.created_at)}</span>
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          title="تعليم كمقروء"
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(n.id)}
                        title="حذف"
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-foreground/10 p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="block w-full rounded-xl py-2 text-center text-xs font-semibold text-primary hover:bg-primary/10"
              >
                عرض كل الإشعارات
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
