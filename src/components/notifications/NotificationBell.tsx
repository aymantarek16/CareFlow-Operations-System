import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
      return null;
    default:
      return null;
  }
}

type PanelPosition = { top: number; left: number };

/**
 * Compute the panel's top-left corner so it stays inside the viewport
 * regardless of the trigger's position (inside a clipped sidebar, near
 * the edge of the screen, etc.).
 */
function computePanelPosition(
  trigger: DOMRect,
  panelWidth: number,
  panelHeight: number,
  gap = 10,
): PanelPosition {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const margin = 12;

  // Try to align to the start (right edge in RTL). Clamp inside viewport.
  let left = trigger.right - panelWidth;
  if (left < margin) left = margin;
  if (left + panelWidth > viewportW - margin) {
    left = viewportW - panelWidth - margin;
  }

  // Prefer opening below the trigger.
  let top = trigger.bottom + gap;
  if (top + panelHeight > viewportH - margin) {
    // Otherwise open above.
    top = Math.max(margin, trigger.top - panelHeight - gap);
  }

  return { top, left };
}

export function NotificationBell() {
  const { appUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPosition | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const PANEL_WIDTH = 380;
  const PANEL_MAX_HEIGHT = 520;

  const { items, unreadCount, markRead, markAllRead, remove, loading } = useNotifications(30_000);

  useEscapeClose(open, () => setOpen(false));

  // Position the panel once it opens and on viewport changes.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPos(computePanelPosition(rect, PANEL_WIDTH, PANEL_MAX_HEIGHT));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

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

  const panel = open && pos
    ? createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="الإشعارات"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: PANEL_WIDTH,
            maxHeight: PANEL_MAX_HEIGHT,
            zIndex: 1000,
          }}
          className="flex flex-col overflow-hidden rounded-3xl border border-foreground/15 bg-[#0b1f19] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] backdrop-blur"
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-foreground/10 bg-foreground/[0.02] p-4">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bell className="h-4 w-4 text-primary" />
                الإشعارات
              </h3>
              <p className="mt-0.5 text-xs text-foreground/50">
                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "لا إشعارات جديدة"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20"
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
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5">
                  <Bell className="h-6 w-6 text-foreground/30" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground/70">لا توجد إشعارات</p>
                <p className="mt-1 text-xs text-foreground/40">ستظهر الإشعارات هنا عند وصولها</p>
              </div>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {items.slice(0, 15).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "group relative flex gap-3 px-4 py-3 transition hover:bg-foreground/[0.04]",
                      !n.read && "bg-primary/[0.05]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className="flex flex-1 items-start gap-3 text-start"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
                        {iconFor(n.type)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-foreground/60">{n.message}</span>
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

          <div className="border-t border-foreground/10 bg-foreground/[0.02] p-2">
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
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/80 transition hover:bg-foreground/10 hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#071410]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
