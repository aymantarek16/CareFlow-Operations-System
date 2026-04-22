import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { CalendarDays, Stethoscope, FileText, CreditCard } from "lucide-react";

export default function PatientDashboard() {
  const { patient, myAppointments, myDoctors, metrics } = usePatientOverview();
  const dm = new Map(myDoctors.map((d) => [d.id, `${d.first_name??""} ${d.last_name??""}`.trim()||d.id]));
  return (
    <div>
      <PageHeader eyebrow="Patient Portal" title={`أهلاً ${patient?.first_name ?? "بك"}`} description="ملخص حسابك مع المواعيد والسجلات." />
      <div className="metric-grid">
        <StatCard title="المواعيد" value={metrics.appointmentsCount} hint="إجمالي مواعيدك" tone="cyan" icon={CalendarDays} />
        <StatCard title="الأطباء" value={metrics.doctorsCount} hint="أطباء مرتبطون" tone="emerald" icon={Stethoscope} />
        <StatCard title="السجلات" value={metrics.recordsCount} hint="سجلات طبية" tone="violet" icon={FileText} />
        <StatCard title="الفواتير" value={metrics.invoicesCount} hint="فواتير مسجلة" tone="amber" icon={CreditCard} />
      </div>
      <div className="mt-6">
        <GlassCard title="مواعيدي" subtitle="جدول الزيارات">
          <DataTable columns={["الطبيب","التاريخ","الوقت","الحالة","ملاحظات"]}
            rows={myAppointments.map((a) => [dm.get(a.doctor_id)??a.doctor_id, formatDate(a.appointment_date), formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status}/>, a.notes??a.reason??"-"])} />
        </GlassCard>
      </div>
    </div>
  );
}
