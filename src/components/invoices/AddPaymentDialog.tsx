import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import {
  createPaymentSchema,
  safeValidate,
} from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/sanitize";
import {
  PAYMENT_METHOD_OPTIONS,
  formatMoney,
  invoiceRemaining,
  num,
} from "@/lib/billing";
import { toast } from "sonner";
import { Banknote, X } from "lucide-react";
import type { InvoiceRecord, PaymentMethod } from "@/lib/types";

interface AddPaymentDialogProps {
  open: boolean;
  invoice: InvoiceRecord | null;
  onOpenChange: (open: boolean) => void;
  onPaid?: () => void;
}

export function AddPaymentDialog({
  open,
  invoice,
  onOpenChange,
  onPaid,
}: AddPaymentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    method: "cash" as PaymentMethod,
    notes: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({ amount: "", method: "cash", notes: "" });
    } else if (invoice) {
      setForm((f) => ({
        ...f,
        amount: String(invoiceRemaining(invoice)),
      }));
    }
  }, [open, invoice]);

  useEscapeClose(open, () => onOpenChange(false));

  if (!open || !invoice) return null;

  const remaining = invoiceRemaining(invoice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = safeValidate(createPaymentSchema, {
      invoice_id: invoice.id,
      amount: form.amount,
      method: form.method,
      notes: form.notes,
    });
    if (!validation.data) {
      toast.error("بيانات غير صالحة", {
        description: validation.error ?? undefined,
      });
      return;
    }

    if (validation.data.amount > remaining + 0.001) {
      toast.error("المبلغ أكبر من المتبقي", {
        description: `المتبقي على هذه الفاتورة: ${formatMoney(remaining)}`,
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      patient_id: invoice.patient_id,
      amount: validation.data.amount,
      method: validation.data.method,
      notes: validation.data.notes || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("فشل تسجيل الدفعة", {
        description: friendlyErrorMessage(error.message),
      });
      return;
    }

    toast.success("تم تسجيل الدفعة بنجاح");
    onPaid?.();
    onOpenChange(false);
  };

  const inputClass =
    "h-11 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-[#0b1f19] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Banknote className="h-5 w-5 text-primary" />
              تسجيل دفعة
            </h3>
            <p className="mt-1 text-sm text-foreground/55">
              المتبقي على الفاتورة:{" "}
              <span className="font-semibold text-amber-300">
                {formatMoney(remaining)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              المبلغ المدفوع *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={remaining}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              autoFocus
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              طريقة الدفع *
            </label>
            <select
              value={form.method}
              onChange={(e) =>
                setForm({ ...form, method: e.target.value as PaymentMethod })
              }
              className={inputClass + " bg-[#0b1f19]"}
            >
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              ملاحظات
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              maxLength={500}
              className={inputClass + " h-auto py-2"}
            />
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">
            <div className="flex justify-between text-foreground/70">
              <span>إجمالي الفاتورة</span>
              <span>{formatMoney(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-foreground/70">
              <span>المدفوع حتى الآن</span>
              <span>{formatMoney(invoice.paid_amount)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-foreground/10 pt-2 font-semibold text-foreground">
              <span>المتبقي بعد الدفع</span>
              <span className="text-primary">
                {formatMoney(Math.max(remaining - num(form.amount), 0))}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/10"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "جاري الحفظ..." : "تسجيل الدفعة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
