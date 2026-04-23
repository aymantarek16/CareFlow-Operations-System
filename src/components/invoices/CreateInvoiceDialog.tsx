import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePatients } from "@/hooks/useData";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { toast } from "sonner";
import { CreditCard, X } from "lucide-react";

type InvoiceStatus = "pending" | "paid" | "cancelled" | "refunded";

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "pending", label: "معلقة" },
  { value: "paid", label: "مدفوعة" },
  { value: "cancelled", label: "ملغية" },
  { value: "refunded", label: "مستردة" },
];

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateInvoiceDialog({ open, onOpenChange, onCreated }: CreateInvoiceDialogProps) {
  const { data: patients, loading: patientsLoading } = usePatients();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    amount: "",
    status: "pending" as InvoiceStatus,
    issue_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        patient_id: "",
        amount: "",
        status: "pending",
        issue_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
  }, [open]);

  useEscapeClose(open, () => onOpenChange(false));

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) {
      toast.error("اختر المريض أولاً");
      return;
    }
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("أدخل مبلغاً صحيحاً أكبر من صفر");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("invoices").insert({
      patient_id: form.patient_id,
      amount: amountNum,
      status: form.status,
      issue_date: form.issue_date || null,
      notes: form.notes || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("فشل إنشاء الفاتورة", { description: error.message });
      return;
    }

    toast.success("تم إنشاء الفاتورة بنجاح");
    onCreated?.();
    onOpenChange(false);
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-[28px] border border-foreground/10 bg-[#0b1f19] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              إنشاء فاتورة جديدة
            </h3>
            <p className="mt-1 text-sm text-foreground/55">
              اختر المريض والمبلغ وحالة الفاتورة.
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
            <label className="mb-1 block text-xs font-semibold text-foreground/70">المريض</label>
            <select
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              required
              disabled={patientsLoading}
              className={selectClass}
            >
              <option value="">
                {patientsLoading ? "جاري التحميل..." : "اختر المريض"}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(بدون اسم)"}
                  {p.phone ? ` — ${p.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                المبلغ (ج.م)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
                className={selectClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              تاريخ الإصدار
            </label>
            <input
              type="date"
              value={form.issue_date}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={inputClass + " h-auto py-3"}
              placeholder="تفاصيل الخدمة أو الكشف..."
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-2xl border border-foreground/10 px-5 text-sm font-semibold text-foreground/70 hover:bg-foreground/5"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  إنشاء الفاتورة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
