/**
 * Billing utilities: pure helpers for invoice math, formatting, and labels.
 *
 * The DB layer keeps numerics as numeric(10,2). On the client we may receive
 * them as `number | string` because supabase-js stringifies large numerics.
 * These helpers normalise to number first, then format for display.
 */
import type {
  InvoiceItem,
  InvoiceRecord,
  InvoiceStatus,
  PaymentMethod,
} from "@/lib/types";

export const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const formatMoney = (v: number | string | null | undefined): string => {
  const n = num(v);
  return `${n.toFixed(2)} ج.م`;
};

/**
 * Compute totals from a working draft (items + tax + discount).
 * Mirrors the SQL trigger so the client preview matches the server.
 */
export function computeInvoiceTotals(input: {
  items: { quantity: number | string; unit_price: number | string }[];
  discount: number | string;
  tax: number | string;
}): { subtotal: number; total: number } {
  const subtotal = input.items.reduce(
    (acc, it) => acc + num(it.quantity) * num(it.unit_price),
    0,
  );
  const total = Math.max(subtotal - num(input.discount) + num(input.tax), 0);
  return { subtotal, total };
}

export function invoiceRemaining(inv: InvoiceRecord): number {
  return Math.max(num(inv.total_amount) - num(inv.paid_amount), 0);
}

export function invoiceItemTotal(it: InvoiceItem): number {
  return num(it.quantity) * num(it.unit_price);
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending: "معلقة",
  partially_paid: "مدفوعة جزئياً",
  paid: "مدفوعة",
  cancelled: "ملغية",
  refunded: "مستردة",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "نقدي",
  card: "بطاقة بنكية",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  other: "أخرى",
};

export const INVOICE_STATUS_OPTIONS: {
  value: InvoiceStatus;
  label: string;
}[] = [
  { value: "pending", label: "معلقة" },
  { value: "partially_paid", label: "مدفوعة جزئياً" },
  { value: "paid", label: "مدفوعة" },
  { value: "cancelled", label: "ملغية" },
  { value: "refunded", label: "مستردة" },
];

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: "cash", label: "نقدي" },
  { value: "card", label: "بطاقة بنكية" },
  { value: "vodafone_cash", label: "فودافون كاش" },
  { value: "instapay", label: "إنستاباي" },
  { value: "other", label: "أخرى" },
];

export function formatInvoiceStatus(status?: string | null): string {
  if (!status) return "غير محدد";
  return INVOICE_STATUS_LABEL[status as InvoiceStatus] ?? status;
}

export function formatPaymentMethod(method?: string | null): string {
  if (!method) return "-";
  return PAYMENT_METHOD_LABEL[method as PaymentMethod] ?? method;
}

export function isWithinDateRange(
  dateIso: string | null | undefined,
  from?: string,
  to?: string,
): boolean {
  if (!dateIso) return !from && !to;
  const d = new Date(dateIso).getTime();
  if (!Number.isFinite(d)) return false;
  if (from) {
    const f = new Date(from).getTime();
    if (Number.isFinite(f) && d < f) return false;
  }
  if (to) {
    const t = new Date(to).getTime();
    if (Number.isFinite(t) && d > t + 24 * 3600 * 1000 - 1) return false;
  }
  return true;
}
