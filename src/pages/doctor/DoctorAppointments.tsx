import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDoctorOverview } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";

export default function DoctorAppointments() {
  const { myAppointments, myPatients } = useDoctorOverview();
  const pm = new Map(myPatients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id]));
  return (
    <div>
      <PageHeader eyebrow="Doctor / Appointments" title="جدول المواعيد" />
      <GlassCard title="المواعيد" subtitle="بيانات مباشرة">
        <DataTable columns={["المريض","التاريخ","الوقت","الحالة","السبب","ملاحظات"]}
          rows={myAppointments.map((a) => [pm.get(a.patient_id)??a.patient_id, formatDate(a.appointment_date), formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status}/>, a.reason??"-", a.notes??"-"])} />
      </GlassCard>
    </div>
  );
}
