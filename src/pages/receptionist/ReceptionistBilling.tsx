import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvoices } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";
export default function ReceptionistBilling() {
  const { data: invoices } = useInvoices();
  return (<div><PageHeader eyebrow="Receptionist / Billing" title="الفواتير" />
    <GlassCard title={`الفواتير (${invoices.length})`}>
      <DataTable columns={["رقم","المبلغ","الحالة","التاريخ","ملاحظات"]}
        rows={invoices.map((i)=>[i.id.slice(0,8), `${i.amount} ر.س`, <StatusBadge key={i.id} status={i.status}/>, formatDate(i.issue_date), i.notes??"-"])}
        emptyMessage="لا توجد فواتير." />
    </GlassCard></div>);
}
