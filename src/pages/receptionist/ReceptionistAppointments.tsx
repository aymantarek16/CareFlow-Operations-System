import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, usePatients, useDoctors } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { useState } from "react";
export default function ReceptionistAppointments() {
  const { data: appointments } = useAppointments();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const [filter, setFilter] = useState("");
  const pm = new Map(patients.map((p) => [p.id, `${p.first_name??""} ${p.last_name??""}`.trim()||p.id]));
  const dm = new Map(doctors.map((d) => [d.id, `${d.first_name??""} ${d.last_name??""}`.trim()||d.id]));
  const filtered = filter ? appointments.filter((a)=>a.status===filter) : appointments;
  return (<div><PageHeader eyebrow="Receptionist / Appointments" title="إدارة المواعيد" />
    <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="h-12 max-w-xs rounded-2xl border border-foreground/10 bg-[#0b1f19] px-4 text-sm text-foreground mb-4">
      <option value="">كل الحالات</option><option value="scheduled">مجدول</option><option value="checked-in">تم التسجيل</option><option value="completed">مكتمل</option><option value="cancelled">ملغى</option>
    </select>
    <GlassCard title={`المواعيد (${filtered.length})`}>
      <DataTable columns={["المريض","الطبيب","التاريخ","الوقت","الحالة"]}
        rows={filtered.map((a)=>[pm.get(a.patient_id)??"-", dm.get(a.doctor_id)??"-", formatDate(a.appointment_date), formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status}/>])} />
    </GlassCard></div>);
}
