import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/helpers";
import type { PatientProfile, AppointmentRecord } from "@/lib/types";

export default function AdminPatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("patients").select("*").eq("id", id).single().then(({ data }) => setPatient(data));
    supabase.from("appointments").select("*").eq("patient_id", id).order("appointment_date", { ascending: false }).then(({ data }) => setAppointments(data ?? []));
  }, [id]);

  if (!patient) return <div className="py-20 text-center text-foreground/50">جاري التحميل...</div>;

  const name = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();

  return (
    <div>
      <PageHeader eyebrow="Admin / Patients / Detail" title={name || "تفاصيل المريض"} description="ملف المريض الكامل مع تاريخ الزيارات" actions={<Link to="/admin/patients" className="text-sm text-primary hover:underline">← العودة للقائمة</Link>} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          ["الهاتف", patient.phone],
          ["النوع", patient.gender],
          ["تاريخ الميلاد", patient.date_of_birth],
          ["المواعيد", appointments.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel rounded-[24px] p-5">
            <p className="text-sm text-foreground/50">{label}</p>
            <p className="mt-2 text-xl font-bold text-foreground">{String(value ?? "-")}</p>
          </div>
        ))}
      </div>

      <GlassCard title="تاريخ المواعيد" subtitle="جميع زيارات المريض">
        <DataTable
          columns={["التاريخ", "الوقت", "الحالة", "السبب", "الملاحظات"]}
          rows={appointments.map((a) => [
            formatDate(a.appointment_date), formatTime(a.appointment_time),
            <StatusBadge key={a.id} status={a.status} />, a.reason ?? "-", a.notes ?? "-",
          ])}
        />
      </GlassCard>
    </div>
  );
}
