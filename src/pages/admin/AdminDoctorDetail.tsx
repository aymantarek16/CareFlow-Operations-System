import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/helpers";
import type { DoctorProfile, AppointmentRecord } from "@/lib/types";

export default function AdminDoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("doctors").select("*").eq("id", id).single().then(({ data }) => setDoctor(data));
    supabase.from("appointments").select("*").eq("doctor_id", id).order("appointment_date", { ascending: false }).then(({ data }) => setAppointments(data ?? []));
  }, [id]);

  if (!doctor) return <div className="py-20 text-center text-foreground/50">جاري التحميل...</div>;

  const name = `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim();

  return (
    <div>
      <PageHeader eyebrow="Admin / Doctors / Detail" title={name || "تفاصيل الطبيب"} description={`التخصص: ${doctor.specialty ?? "غير محدد"}`}
        actions={<Link to="/admin/doctors" className="text-sm text-primary hover:underline">← العودة للقائمة</Link>} />
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {[["التخصص", doctor.specialty], ["الهاتف", doctor.phone], ["المواعيد", appointments.length]].map(([l, v]) => (
          <div key={String(l)} className="panel rounded-[24px] p-5">
            <p className="text-sm text-foreground/50">{l}</p>
            <p className="mt-2 text-xl font-bold text-foreground">{String(v ?? "-")}</p>
          </div>
        ))}
      </div>
      <GlassCard title="مواعيد الطبيب" subtitle="جميع المواعيد المرتبطة">
        <DataTable
          columns={["التاريخ", "الوقت", "الحالة", "السبب"]}
          rows={appointments.map((a) => [
            formatDate(a.appointment_date), formatTime(a.appointment_time),
            <StatusBadge key={a.id} status={a.status} />, a.reason ?? "-",
          ])}
        />
      </GlassCard>
    </div>
  );
}
