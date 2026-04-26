import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";
import { generatePdfReport } from "@/lib/pdf";
import {
  formatMoney,
  formatInvoiceStatus,
  invoiceRemaining,
  num,
} from "@/lib/billing";
import { Download, Printer, Eye } from "lucide-react";
import { toast } from "sonner";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import type { InvoiceRecord } from "@/lib/types";

export default function PatientInvoices() {
  const { myInvoices } = usePatientOverview();
  const [exporting, setExporting] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  const totalAmount = myInvoices.reduce(
    (s, i) => s + num(i.total_amount || i.amount),
    0,
  );
  const paidAmount = myInvoices.reduce((s, i) => s + num(i.paid_amount), 0);
  const remainingAmount = myInvoices.reduce(
    (s, i) => s + invoiceRemaining(i),
    0,
  );

  const exportAll = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "فواتيري",
        subtitle: `إجمالي ${myInvoices.length} فاتورة`,
        filename: `my-invoices-${new Date().toISOString().slice(0, 10)}`,
        meta: [
          { label: "عدد الفواتير", value: myInvoices.length },
          { label: "الإجمالي", value: formatMoney(totalAmount) },
          { label: "المدفوع", value: formatMoney(paidAmount) },
          { label: "المتبقي", value: formatMoney(remainingAmount) },
        ],
        table: {
          columns: ["رقم", "الإجمالي", "المدفوع", "المتبقي", "الحالة", "التاريخ"],
          rows: myInvoices.map((i) => [
            i.id.slice(0, 8),
            formatMoney(i.total_amount || i.amount),
            formatMoney(i.paid_amount),
            formatMoney(invoiceRemaining(i)),
            formatInvoiceStatus(i.status),
            formatDate(i.issue_date),
          ]),
        },
      });
      toast.success("تم تحميل التقرير");
    } catch {
      toast.error("تعذّر إنشاء ملف PDF");
    } finally {
      setExporting(false);
    }
  };

  const printOne = async (inv: InvoiceRecord) => {
    try {
      await generatePdfReport({
        title: "فاتورة",
        subtitle: `رقم الفاتورة: ${inv.id.slice(0, 8)}`,
        filename: `invoice-${inv.id.slice(0, 8)}`,
        meta: [
          { label: "تاريخ الإصدار", value: formatDate(inv.issue_date) },
          { label: "الحالة", value: formatInvoiceStatus(inv.status) },
          { label: "الإجمالي", value: formatMoney(inv.total_amount || inv.amount) },
          { label: "المدفوع", value: formatMoney(inv.paid_amount) },
          { label: "المتبقي", value: formatMoney(invoiceRemaining(inv)) },
        ],
        sections: inv.notes ? [{ heading: "ملاحظات", body: inv.notes }] : undefined,
        footer: "شكراً لاختياركم خدماتنا",
      });
      toast.success("تم تحميل الفاتورة");
    } catch {
      toast.error("تعذّر إنشاء الفاتورة");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Patient / Invoices" title="فواتيري والمدفوعات" />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">عدد الفواتير</p>
          <p className="text-2xl font-bold text-foreground">
            {myInvoices.length}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">الإجمالي</p>
          <p className="text-2xl font-bold text-foreground">
            {formatMoney(totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المدفوع</p>
          <p className="text-2xl font-bold text-emerald-400">
            {formatMoney(paidAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المتبقي</p>
          <p className="text-2xl font-bold text-amber-400">
            {formatMoney(remainingAmount)}
          </p>
        </div>
      </div>

      <GlassCard
        title="الفواتير"
        subtitle="عرض الفواتير الخاصة بك (للقراءة فقط)"
        action={
          <button
            type="button"
            onClick={exportAll}
            disabled={exporting || myInvoices.length === 0}
            className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "جاري التصدير..." : "تصدير PDF"}
          </button>
        }
      >
        <DataTable
          columns={[
            "رقم",
            "الإجمالي",
            "المدفوع",
            "المتبقي",
            "الحالة",
            "التاريخ",
            "إجراءات",
          ]}
          rows={myInvoices.map((i) => {
            const remaining = invoiceRemaining(i);
            return [
              i.id.slice(0, 8),
              formatMoney(i.total_amount || i.amount),
              formatMoney(i.paid_amount),
              <span
                key={`r-${i.id}`}
                className={
                  remaining > 0
                    ? "font-semibold text-amber-300"
                    : "text-foreground/50"
                }
              >
                {formatMoney(remaining)}
              </span>,
              <StatusBadge key={`s-${i.id}`} status={i.status} />,
              formatDate(i.issue_date),
              <div key={`a-${i.id}`} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewId(i.id)}
                  title="عرض التفاصيل"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => printOne(i)}
                  title="طباعة الفاتورة"
                  className="flex h-8 items-center gap-1 rounded-lg bg-foreground/5 px-2 text-xs text-foreground/80 hover:bg-foreground/10"
                >
                  <Printer className="h-3.5 w-3.5" />
                  طباعة
                </button>
              </div>,
            ];
          })}
          emptyMessage="لا توجد فواتير حالياً."
        />
      </GlassCard>

      <ViewInvoiceDialog
        open={!!viewId}
        invoiceId={viewId}
        onOpenChange={(o) => !o && setViewId(null)}
      />
    </div>
  );
}
