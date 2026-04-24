import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvoices, usePatients } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";
import { generatePdfReport } from "@/lib/pdf";
import { CreditCard, FileText, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import type { InvoiceRecord } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "معلقة",
  paid: "مدفوعة",
  cancelled: "ملغية",
  refunded: "مستردة",
};

export default function AdminInvoices() {
  const { data: invoices, loading, refetch } = useInvoices();
  const { data: patients } = usePatients();
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const patientName = (id: string) => {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "-" : "-";
  };

  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingAmount = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalAmount = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const exportAllInvoices = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "تقرير الفواتير",
        subtitle: `إجمالي ${invoices.length} فاتورة`,
        filename: `invoices-report-${new Date().toISOString().slice(0, 10)}`,
        meta: [
          { label: "عدد الفواتير", value: invoices.length },
          { label: "الإجمالي", value: `${totalAmount.toFixed(2)} ج.م` },
          { label: "المدفوع", value: `${paidAmount.toFixed(2)} ج.م` },
          { label: "المعلق", value: `${pendingAmount.toFixed(2)} ج.م` },
        ],
        table: {
          columns: ["رقم الفاتورة", "المريض", "المبلغ", "الحالة", "تاريخ الإصدار", "ملاحظات"],
          rows: invoices.map((inv) => [
            inv.id.slice(0, 8),
            patientName(inv.patient_id),
            `${Number(inv.amount).toFixed(2)} ج.م`,
            STATUS_LABEL[inv.status ?? ""] ?? inv.status ?? "-",
            formatDate(inv.issue_date),
            inv.notes ?? "-",
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

  const printSingleInvoice = async (inv: InvoiceRecord) => {
    try {
      await generatePdfReport({
        title: "فاتورة طبية",
        subtitle: `رقم الفاتورة: ${inv.id.slice(0, 8)}`,
        filename: `invoice-${inv.id.slice(0, 8)}`,
        meta: [
          { label: "اسم المريض", value: patientName(inv.patient_id) },
          { label: "تاريخ الإصدار", value: formatDate(inv.issue_date) },
          { label: "الحالة", value: STATUS_LABEL[inv.status ?? ""] ?? inv.status ?? "-" },
          { label: "المبلغ الإجمالي", value: `${Number(inv.amount).toFixed(2)} ج.م` },
        ],
        sections: inv.notes
          ? [{ heading: "ملاحظات", body: inv.notes }]
          : undefined,
        footer: "شكراً لاختياركم خدماتنا",
      });
      toast.success("تم تحميل الفاتورة");
    } catch {
      toast.error("تعذّر إنشاء الفاتورة");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin / Billing" title="الفواتير والحسابات" description="إدارة الفواتير والمدفوعات للمرضى." />

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">إجمالي الفواتير</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المدفوع</p>
          <p className="text-2xl font-bold text-emerald-400">{paidAmount.toFixed(2)} ج.م</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المعلق</p>
          <p className="text-2xl font-bold text-amber-400">{pendingAmount.toFixed(2)} ج.م</p>
        </div>
      </div>

      <GlassCard
        title={`الفواتير (${invoices.length})`}
        subtitle="جميع الفواتير المسجلة"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAllInvoices}
              disabled={exporting || invoices.length === 0}
              className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "جاري التصدير..." : "تصدير PDF"}
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              <CreditCard className="h-3.5 w-3.5" />
              فاتورة جديدة
            </button>
          </div>
        }
      >
        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : invoices.length === 0 ? (
          <EmptyState
            variant="data"
            title="لا توجد فواتير"
            description="لم يتم إصدار أي فواتير بعد"
            action={
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white"
              >
                <FileText className="h-4 w-4" />
                إنشاء فاتورة
              </button>
            }
          />
        ) : (
          <DataTable
            columns={["رقم الفاتورة", "المريض", "المبلغ", "الحالة", "تاريخ الإصدار", "إجراءات"]}
            rows={invoices.map((inv) => [
              inv.id.slice(0, 8),
              patientName(inv.patient_id),
              `${inv.amount} ج.م`,
              <StatusBadge key={inv.id} status={inv.status} />,
              formatDate(inv.issue_date),
              <button
                key={inv.id}
                type="button"
                onClick={() => printSingleInvoice(inv)}
                className="flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1 text-xs text-foreground/80 hover:bg-foreground/10"
                title="طباعة الفاتورة"
              >
                <Printer className="h-3.5 w-3.5" />
                طباعة
              </button>,
            ])}
          />
        )}
      </GlassCard>

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
}
