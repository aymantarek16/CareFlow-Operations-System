import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";
import { generatePdfReport } from "@/lib/pdf";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import type { InvoiceRecord } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "معلقة",
  paid: "مدفوعة",
  cancelled: "ملغية",
  refunded: "مستردة",
};

export default function PatientInvoices() {
  const { myInvoices } = usePatientOverview();
  const [exporting, setExporting] = useState(false);

  const paidAmount = myInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
  const pendingAmount = myInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + Number(i.amount || 0), 0);

  const exportAll = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "فواتيري",
        subtitle: `إجمالي ${myInvoices.length} فاتورة`,
        filename: `my-invoices-${new Date().toISOString().slice(0, 10)}`,
        meta: [
          { label: "عدد الفواتير", value: myInvoices.length },
          { label: "المدفوع", value: `${paidAmount.toFixed(2)} ج.م` },
          { label: "المعلق", value: `${pendingAmount.toFixed(2)} ج.م` },
        ],
        table: {
          columns: ["رقم", "المبلغ", "الحالة", "التاريخ", "ملاحظات"],
          rows: myInvoices.map((i) => [
            i.id.slice(0, 8),
            `${Number(i.amount).toFixed(2)} ج.م`,
            STATUS_LABEL[i.status ?? ""] ?? i.status ?? "-",
            formatDate(i.issue_date),
            i.notes ?? "-",
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
          { label: "الحالة", value: STATUS_LABEL[inv.status ?? ""] ?? inv.status ?? "-" },
          { label: "المبلغ الإجمالي", value: `${Number(inv.amount).toFixed(2)} ج.م` },
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
      <PageHeader eyebrow="Patient / Invoices" title="المدفوعات" />
      <GlassCard
        title="الفواتير"
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
          columns={["رقم", "المبلغ", "الحالة", "التاريخ", "ملاحظات", "إجراءات"]}
          rows={myInvoices.map((i) => [
            i.id.slice(0, 8),
            `${i.amount} ج.م`,
            <StatusBadge key={i.id} status={i.status} />,
            formatDate(i.issue_date),
            i.notes ?? "-",
            <button
              key={i.id}
              type="button"
              onClick={() => printOne(i)}
              className="flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1 text-xs text-foreground/80 hover:bg-foreground/10"
              title="طباعة الفاتورة"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة
            </button>,
          ])}
          emptyMessage="لا توجد فواتير حالياً."
        />
      </GlassCard>
    </div>
  );
}
