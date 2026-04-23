import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview } from "@/hooks/useData";
import { formatDate } from "@/lib/helpers";
export default function PatientInvoices() {
  const { myInvoices } = usePatientOverview();
  return (<div><PageHeader eyebrow="Patient / Invoices" title="المدفوعات" />
    <GlassCard title="الفواتير">
      <DataTable columns={["رقم","المبلغ","الحالة","التاريخ","ملاحظات"]}
        rows={myInvoices.map((i) => [i.id.slice(0,8), `${i.amount} ج.م`, <StatusBadge key={i.id} status={i.status}/>, formatDate(i.issue_date), i.notes??"-"])}
        emptyMessage="لا توجد فواتير حالياً." />
    </GlassCard></div>);
}
