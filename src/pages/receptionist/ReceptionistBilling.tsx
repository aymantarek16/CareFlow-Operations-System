import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvoices } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";
import { CreditCard, FileText } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";

export default function ReceptionistBilling() {
  const { data: invoices, loading, refetch } = useInvoices();
  const [createOpen, setCreateOpen] = useState(false);

  const paidAmount = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  return (
    <div>
      <PageHeader eyebrow="Receptionist / Billing" title="الفواتير" description="إدارة الفواتير والمدفوعات" />

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
          <p className="text-2xl font-bold text-amber-400">{pendingAmount.toFixed(2)}ج.م</p>
        </div>
      </div>

      <GlassCard
        title={`الفواتير (${invoices.length})`}
        subtitle="قائمة جميع الفواتير"
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <CreditCard className="h-3.5 w-3.5" />
            فاتورة جديدة
          </button>
        }
      >
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : invoices.length === 0 ? (
          <EmptyState
            variant="data"
            title="لا توجد فواتير"
            description="لم يتم إصدار أي فواتير بعد"
            action={
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-background"
              >
                <FileText className="h-4 w-4" />
                إنشاء فاتورة
              </button>
            }
          />
        ) : (
          <DataTable
            columns={["رقم", "المبلغ", "الحالة", "التاريخ", "ملاحظات"]}
            rows={invoices.map((i) => [
              i.id.slice(0, 8),
              `${i.amount} ج.م`,
              <StatusBadge key={i.id} status={i.status} />,
              formatDate(i.issue_date),
              <span key={i.id} className="line-clamp-2 max-w-[200px] text-foreground/60">
                {i.notes ?? "-"}
              </span>,
            ])}
          />
        )}
      </GlassCard>

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
}
