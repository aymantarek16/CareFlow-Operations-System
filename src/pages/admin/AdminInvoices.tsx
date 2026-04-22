import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvoices } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";

export default function AdminInvoices() {
  const { data: invoices, loading } = useInvoices();

  return (
    <div>
      <PageHeader eyebrow="Admin / Billing" title="الفواتير والحسابات" description="إدارة الفواتير والمدفوعات للمرضى." />
      <GlassCard title={`الفواتير (${invoices.length})`} subtitle="جميع الفواتير المسجلة">
        {loading ? <p className="text-foreground/50 py-8 text-center">جاري التحميل...</p> : (
          <DataTable
            columns={["رقم الفاتورة", "المبلغ", "الحالة", "تاريخ الإصدار", "ملاحظات"]}
            rows={invoices.map((inv) => [
              inv.id.slice(0, 8), `${inv.amount} ر.س`,
              <StatusBadge key={inv.id} status={inv.status} />,
              formatDate(inv.issue_date), inv.notes ?? "-",
            ])}
            emptyMessage="لا توجد فواتير حالياً. ستظهر عند إضافة بيانات لجدول invoices."
          />
        )}
      </GlassCard>
    </div>
  );
}
