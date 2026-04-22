import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, usePatients } from "@/hooks/useData";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/lib/helpers";

export default function ReceptionistCheckIn() {
  const { data: appointments, refetch } = useAppointments();
  const { data: patients } = usePatients();
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const pm = new Map(patients.map((p) => [p.id, `${p.first_name??""} ${p.last_name??""}`.trim()||p.id]));
  const [updating, setUpdating] = useState<string|null>(null);

  const checkIn = async (id: string) => {
    setUpdating(id);
    await supabase.from("appointments").update({ status: "checked-in" }).eq("id", id);
    refetch();
    setUpdating(null);
  };

  return (<div><PageHeader eyebrow="Receptionist / Check-in" title="تسجيل حضور المرضى" description="سجل حضور المرضى لمواعيد اليوم." />
    <GlassCard title={`مواعيد اليوم (${todayAppts.length})`}>
      <DataTable columns={["المريض","الوقت","الحالة","إجراء"]}
        rows={todayAppts.map((a) => [
          pm.get(a.patient_id)??"-", formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status}/>,
          a.status === "scheduled" ? <button key={a.id+"b"} onClick={()=>checkIn(a.id)} disabled={updating===a.id} className="text-xs text-primary hover:underline">{updating===a.id?"جارٍ...":"تسجيل حضور"}</button> : <span key={a.id+"s"} className="text-xs text-foreground/40">—</span>
        ])} emptyMessage="لا توجد مواعيد لليوم." />
    </GlassCard></div>);
}
