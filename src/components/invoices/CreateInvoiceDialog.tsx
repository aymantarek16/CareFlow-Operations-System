import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePatients, useDoctors, useAppointments } from "@/hooks/useData";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import {
  invoiceItemsArraySchema,
  optionalMultilineSchema,
  safeValidate,
  invoiceAmountSchema,
} from "@/lib/validation";
import { friendlyErrorMessage, sanitizeDate } from "@/lib/sanitize";
import { computeInvoiceTotals, formatMoney, num } from "@/lib/billing";
import { z } from "zod";
import { toast } from "sonner";
import { CreditCard, Plus, Trash2, X } from "lucide-react";

const createInvoiceMetaSchema = z.object({
  patient_id: z.string().uuid("مريض غير صالح"),
  doctor_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  appointment_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  issue_date: z.string().transform(sanitizeDate),
  discount: invoiceAmountSchema,
  tax: invoiceAmountSchema,
  notes: optionalMultilineSchema(2000),
});

type ItemDraft = {
  service_name: string;
  quantity: string;
  unit_price: string;
};

const emptyItem = (): ItemDraft => ({
  service_name: "",
  quantity: "1",
  unit_price: "",
});

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateInvoiceDialogProps) {
  const { data: patients, loading: patientsLoading } = usePatients();
  const { data: doctors } = useDoctors();
  const { data: appointments } = useAppointments();
  const [submitting, setSubmitting] = useState(false);

  const [meta, setMeta] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_id: "",
    issue_date: new Date().toISOString().slice(0, 10),
    discount: "0",
    tax: "0",
    notes: "",
  });
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  useEffect(() => {
    if (!open) {
      setMeta({
        patient_id: "",
        doctor_id: "",
        appointment_id: "",
        issue_date: new Date().toISOString().slice(0, 10),
        discount: "0",
        tax: "0",
        notes: "",
      });
      setItems([emptyItem()]);
    }
  }, [open]);

  useEscapeClose(open, () => onOpenChange(false));

  const filteredAppointments = useMemo(
    () =>
      meta.patient_id
        ? appointments.filter((a) => a.patient_id === meta.patient_id)
        : [],
    [appointments, meta.patient_id],
  );

  const totals = useMemo(
    () =>
      computeInvoiceTotals({
        items: items.map((it) => ({
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
        discount: meta.discount,
        tax: meta.tax,
      }),
    [items, meta.discount, meta.tax],
  );

  if (!open) return null;

  const updateItem = (idx: number, patch: Partial<ItemDraft>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const metaVal = safeValidate(createInvoiceMetaSchema, meta);
    if (!metaVal.data) {
      toast.error("بيانات غير صالحة", {
        description: metaVal.error ?? undefined,
      });
      return;
    }

    const itemsVal = safeValidate(invoiceItemsArraySchema, items);
    if (!itemsVal.data) {
      toast.error("الخدمات غير صالحة", {
        description: itemsVal.error ?? undefined,
      });
      return;
    }

    const cleanMeta = metaVal.data;
    const cleanItems = itemsVal.data;

    setSubmitting(true);

    const { data: insertedInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        patient_id: cleanMeta.patient_id,
        doctor_id: cleanMeta.doctor_id,
        appointment_id: cleanMeta.appointment_id,
        amount: totals.total,
        subtotal: totals.subtotal,
        discount: num(cleanMeta.discount),
        tax: num(cleanMeta.tax),
        total_amount: totals.total,
        paid_amount: 0,
        status: "pending",
        issue_date: cleanMeta.issue_date || null,
        notes: cleanMeta.notes || null,
      })
      .select()
      .single();

    if (invoiceError || !insertedInvoice) {
      setSubmitting(false);
      toast.error("فشل إنشاء الفاتورة", {
        description: friendlyErrorMessage(invoiceError?.message),
      });
      return;
    }

    const itemRows = cleanItems.map((it) => ({
      invoice_id: insertedInvoice.id,
      service_name: it.service_name,
      quantity: it.quantity,
      unit_price: it.unit_price,
    }));
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemRows);

    setSubmitting(false);

    if (itemsError) {
      toast.error("تم إنشاء الفاتورة لكن فشل حفظ الخدمات", {
        description: friendlyErrorMessage(itemsError.message),
      });
      onCreated?.();
      onOpenChange(false);
      return;
    }

    toast.success("تم إنشاء الفاتورة بنجاح");
    onCreated?.();
    onOpenChange(false);
  };

  const inputClass =
    "h-11 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[28px] border border-foreground/10 bg-[#0b1f19] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              إنشاء فاتورة جديدة
            </h3>
            <p className="mt-1 text-sm text-foreground/55">
              اختر المريض، أضف الخدمات، النظام يحسب الإجمالي تلقائياً.
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

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                المريض *
              </label>
              <select
                value={meta.patient_id}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    patient_id: e.target.value,
                    appointment_id: "",
                  })
                }
                required
                disabled={patientsLoading}
                className={selectClass}
              >
                <option value="">
                  {patientsLoading ? "جاري التحميل..." : "اختر المريض"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() ||
                      "(بدون اسم)"}
                    {p.phone ? ` — ${p.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                الطبيب (اختياري)
              </label>
              <select
                value={meta.doctor_id}
                onChange={(e) =>
                  setMeta({ ...meta, doctor_id: e.target.value })
                }
                className={selectClass}
              >
                <option value="">بدون طبيب</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {`د. ${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()}
                    {d.specialty ? ` — ${d.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                ربط بموعد (اختياري)
              </label>
              <select
                value={meta.appointment_id}
                onChange={(e) =>
                  setMeta({ ...meta, appointment_id: e.target.value })
                }
                disabled={!meta.patient_id}
                className={selectClass}
              >
                <option value="">بدون موعد</option>
                {filteredAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.appointment_date ?? "—"} {a.appointment_time ?? ""} —{" "}
                    {a.reason ?? "زيارة"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                تاريخ الإصدار *
              </label>
              <input
                type="date"
                value={meta.issue_date}
                onChange={(e) =>
                  setMeta({ ...meta, issue_date: e.target.value })
                }
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                الخدمات والبنود
              </h4>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة خدمة
              </button>
            </div>

            <div className="grid gap-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid items-end gap-2 md:grid-cols-[1fr_80px_120px_120px_40px]"
                >
                  <div>
                    <label className="mb-1 block text-[11px] text-foreground/60">
                      اسم الخدمة
                    </label>
                    <input
                      type="text"
                      value={it.service_name}
                      onChange={(e) =>
                        updateItem(idx, { service_name: e.target.value })
                      }
                      placeholder="مثال: كشف، أشعة، تحليل دم"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-foreground/60">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(idx, { quantity: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-foreground/60">
                      السعر للوحدة
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.unit_price}
                      onChange={(e) =>
                        updateItem(idx, { unit_price: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-foreground/60">
                      الإجمالي
                    </label>
                    <div className="flex h-11 items-center rounded-2xl border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground/70">
                      {formatMoney(num(it.quantity) * num(it.unit_price))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.length > 1
                          ? prev.filter((_, i) => i !== idx)
                          : prev,
                      )
                    }
                    className="flex h-11 w-10 items-center justify-center rounded-2xl text-rose-400/80 hover:bg-rose-500/10"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                خصم
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={meta.discount}
                onChange={(e) =>
                  setMeta({ ...meta, discount: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">
                ضريبة
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={meta.tax}
                onChange={(e) => setMeta({ ...meta, tax: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              ملاحظات
            </label>
            <textarea
              value={meta.notes}
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
              rows={2}
              maxLength={2000}
              className={inputClass + " h-auto py-2"}
            />
          </div>

          <div className="grid gap-1 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex justify-between text-foreground/70">
              <span>المجموع الفرعي</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-foreground/70">
              <span>الخصم</span>
              <span>- {formatMoney(meta.discount)}</span>
            </div>
            <div className="flex justify-between text-foreground/70">
              <span>الضريبة</span>
              <span>+ {formatMoney(meta.tax)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-foreground/10 pt-2 text-base font-bold text-foreground">
              <span>الإجمالي</span>
              <span className="text-primary">{formatMoney(totals.total)}</span>
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
              {submitting ? "جاري الحفظ..." : "حفظ الفاتورة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
