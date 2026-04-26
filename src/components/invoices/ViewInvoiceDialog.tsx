import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useInvoiceDetails } from "@/hooks/useBilling";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatMoney,
  formatPaymentMethod,
  invoiceItemTotal,
  invoiceRemaining,
} from "@/lib/billing";
import { formatDateTime, formatDate } from "@/lib/helpers";
import { FileText, X } from "lucide-react";

interface ViewInvoiceDialogProps {
  open: boolean;
  invoiceId: string | null;
  patientName?: string;
  doctorName?: string;
  onOpenChange: (open: boolean) => void;
}

export function ViewInvoiceDialog({
  open,
  invoiceId,
  patientName,
  doctorName,
  onOpenChange,
}: ViewInvoiceDialogProps) {
  const { invoice, items, payments, loading } = useInvoiceDetails(
    open ? invoiceId : null,
  );

  useEscapeClose(open, () => onOpenChange(false));

  if (!open) return null;

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
              <FileText className="h-5 w-5 text-primary" />
              تفاصيل الفاتورة {invoice ? `#${invoice.id.slice(0, 8)}` : ""}
            </h3>
            {invoice && (
              <p className="mt-1 text-sm text-foreground/55">
                صدرت في {formatDate(invoice.issue_date)}
              </p>
            )}
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

        {loading || !invoice ? (
          <p className="py-10 text-center text-foreground/50">
            جاري تحميل التفاصيل...
          </p>
        ) : (
          <div className="grid gap-5">
            <section className="grid grid-cols-2 gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-[11px] text-foreground/50">المريض</p>
                <p className="font-semibold text-foreground">
                  {patientName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-foreground/50">الطبيب</p>
                <p className="font-semibold text-foreground">
                  {doctorName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-foreground/50">الحالة</p>
                <StatusBadge status={invoice.status} />
              </div>
              <div>
                <p className="text-[11px] text-foreground/50">تاريخ الإصدار</p>
                <p className="font-semibold text-foreground">
                  {formatDate(invoice.issue_date)}
                </p>
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                الخدمات والبنود
              </h4>
              {items.length === 0 ? (
                <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-center text-foreground/50">
                  لا توجد بنود مسجلة
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-foreground/10">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-foreground/5">
                      <tr>
                        <th className="p-2 font-semibold text-foreground/60">
                          الخدمة
                        </th>
                        <th className="p-2 font-semibold text-foreground/60">
                          الكمية
                        </th>
                        <th className="p-2 font-semibold text-foreground/60">
                          السعر
                        </th>
                        <th className="p-2 font-semibold text-foreground/60">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-t border-foreground/10"
                        >
                          <td className="p-2 text-foreground">
                            {it.service_name}
                          </td>
                          <td className="p-2 text-foreground/80">
                            {it.quantity}
                          </td>
                          <td className="p-2 text-foreground/80">
                            {formatMoney(it.unit_price)}
                          </td>
                          <td className="p-2 font-semibold text-foreground">
                            {formatMoney(invoiceItemTotal(it))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="grid gap-1 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div className="flex justify-between text-foreground/70">
                <span>المجموع الفرعي</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>الخصم</span>
                <span>- {formatMoney(invoice.discount)}</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>الضريبة</span>
                <span>+ {formatMoney(invoice.tax)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-foreground/10 pt-2 text-base font-bold text-foreground">
                <span>الإجمالي</span>
                <span className="text-primary">
                  {formatMoney(invoice.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>المدفوع</span>
                <span className="text-emerald-300">
                  {formatMoney(invoice.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>المتبقي</span>
                <span className="text-amber-300">
                  {formatMoney(invoiceRemaining(invoice))}
                </span>
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                سجل المدفوعات ({payments.length})
              </h4>
              {payments.length === 0 ? (
                <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-center text-foreground/50">
                  لا توجد مدفوعات بعد
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-foreground/10">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-foreground/5">
                      <tr>
                        <th className="p-2 font-semibold text-foreground/60">
                          التاريخ
                        </th>
                        <th className="p-2 font-semibold text-foreground/60">
                          المبلغ
                        </th>
                        <th className="p-2 font-semibold text-foreground/60">
                          الطريقة
                        </th>
                        <th className="p-2 font-semibold text-foreground/60">
                          ملاحظات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-foreground/10"
                        >
                          <td className="p-2 text-foreground/80">
                            {formatDateTime(p.created_at)}
                          </td>
                          <td className="p-2 font-semibold text-emerald-300">
                            {formatMoney(p.amount)}
                          </td>
                          <td className="p-2 text-foreground/80">
                            {formatPaymentMethod(p.method)}
                          </td>
                          <td className="p-2 text-foreground/60">
                            {p.notes ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {invoice.notes && (
              <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-sm">
                <p className="mb-1 text-[11px] font-semibold text-foreground/50">
                  ملاحظات الفاتورة
                </p>
                <p className="whitespace-pre-wrap text-foreground/80">
                  {invoice.notes}
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
