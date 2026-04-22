import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";

export default function PatientAppointments() {
  const { myAppointments, myDoctors } = usePatientOverview();
  const dm = new Map(myDoctors.map((d) => [d.id, `${d.first_name??""} ${d.last_name??""}`.trim()||d.id]));
  return (
    <div>
      <PageHeader eyebrow="Patient / Appointments" title="جدول زياراتي" />
      <GlassCard title="المواعيد">
        <DataTable columns={["الطبيب","التاريخ","الوقت","الحالة","ملاحظات"]}
          rows={myAppointments.map((a) => [dm.get(a.doctor_id)??a.doctor_id, formatDate(a.appointment_date), formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status}/>, a.notes??a.reason??"-"])} />
      </GlassCard>
    </div>
  );
}
