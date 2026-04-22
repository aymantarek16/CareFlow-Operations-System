import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, usePatients } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { CalendarDays, Users, ClipboardCheck, CreditCard } from "lucide-react";

export default function ReceptionistDashboard() {
  const { data: appointments } = useAppointments();
  const { data: patients } = usePatients();
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const checkedIn = appointments.filter((a) => a.status === "checked-in").length;
  const pm = new Map(patients.map((p) => [p.id, `${p.first_name??""} ${p.last_name??""}`.trim()||p.id]));

  return (
    <div>
      <PageHeader eyebrow="Receptionist" title="مركز الاستقبال" description="إدارة الحضور والمواعيد والمرضى من مكان واحد." />
      <div className="metric-grid">
        <StatCard title="مواعيد اليوم" value={todayAppts.length} hint="مواعيد مسجلة لليوم" tone="cyan" icon={CalendarDays} />
        <StatCard title="تم التسجيل" value={checkedIn} hint="مرضى سجلوا حضورهم" tone="emerald" icon={ClipboardCheck} />
        <StatCard title="إجمالي المرضى" value={patients.length} hint="ملفات نشطة" tone="amber" icon={Users} />
        <StatCard title="إجمالي المواعيد" value={appointments.length} hint="كل المواعيد" tone="violet" icon={CreditCard} />
      </div>
      <div className="mt-6">
        <GlassCard title="مواعيد اليوم" subtitle="الجدول التشغيلي">
          <DataTable columns={["المريض","الوقت","الحالة","السبب"]}
            rows={todayAppts.map((a) => [pm.get(a.patient_id)??a.patient_id, formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status}/>, a.reason??"-"])}
            emptyMessage="لا توجد مواعيد مسجلة لليوم." />
        </GlassCard>
      </div>
    </div>
  );
}
