import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/helpers";
import { formatSpecialtyBilingual } from "@/lib/specialties";
import type { AppointmentRecord, PatientProfile, DoctorProfile } from "@/lib/types";
import { appointmentStatusSchema, optionalMultilineSchema, safeValidate } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/sanitize";
import { z } from "zod";
import { toast } from "sonner";

const updateAppointmentSchema = z.object({
  status: appointmentStatusSchema,
  notes: optionalMultilineSchema(2000),
});

export default function AdminAppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("appointments").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setAppointment(data);
        setStatus(data.status ?? "");
        setNotes(data.notes ?? "");
        supabase.from("patients").select("*").eq("id", data.patient_id).single().then(({ data }) => setPatient(data));
        supabase.from("doctors").select("*").eq("id", data.doctor_id).single().then(({ data }) => setDoctor(data));
      }
    });
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;

    const validation = safeValidate(updateAppointmentSchema, { status, notes });
    if (!validation.data) {
      toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
      return;
    }
    const clean = validation.data;

    setSaving(true);
    const { error } = await supabase
      .from("appointments")
      .update({ status: clean.status, notes: clean.notes })
      .eq("id", id);
    if (error) {
      toast.error("تعذّر تحديث الموعد", { description: friendlyErrorMessage(error.message) });
    } else {
      setAppointment((prev) => (prev ? { ...prev, status: clean.status, notes: clean.notes } : prev));
      toast.success("تم تحديث الموعد");
    }
    setSaving(false);
  };

  if (!appointment) return <div className="py-20 text-center text-foreground/50">جاري التحميل...</div>;

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Admin / Appointments / Detail" title="تفاصيل الموعد"
        actions={<Link to="/admin/appointments" className="text-sm text-primary hover:underline">← العودة</Link>} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <div className="panel rounded-[24px] p-5"><p className="text-sm text-foreground/50">التاريخ</p><p className="mt-2 text-lg font-bold text-foreground">{formatDate(appointment.appointment_date)}</p></div>
        <div className="panel rounded-[24px] p-5"><p className="text-sm text-foreground/50">الوقت</p><p className="mt-2 text-lg font-bold text-foreground">{formatTime(appointment.appointment_time)}</p></div>
        <div className="panel rounded-[24px] p-5"><p className="text-sm text-foreground/50">الحالة</p><div className="mt-2"><StatusBadge status={appointment.status} /></div></div>
        <div className="panel rounded-[24px] p-5"><p className="text-sm text-foreground/50">السبب</p><p className="mt-2 text-foreground">{appointment.reason ?? "-"}</p></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <GlassCard title="المريض">
          {patient ? (
            <div className="space-y-2 text-sm">
              <p className="text-foreground"><strong>الاسم:</strong> {patient.first_name} {patient.last_name}</p>
              <p className="text-foreground/70"><strong>الهاتف:</strong> {patient.phone ?? "-"}</p>
              <p className="text-foreground/70"><strong>النوع:</strong> {patient.gender ?? "-"}</p>
            </div>
          ) : <p className="text-foreground/50">جاري التحميل...</p>}
        </GlassCard>
        <GlassCard title="الطبيب">
          {doctor ? (
            <div className="space-y-2 text-sm">
              <p className="text-foreground"><strong>الاسم:</strong> {doctor.first_name} {doctor.last_name}</p>
              <p className="text-foreground/70"><strong>التخصص:</strong> {doctor.specialty ? formatSpecialtyBilingual(doctor.specialty) : "-"}</p>
              <p className="text-foreground/70"><strong>الهاتف:</strong> {doctor.phone ?? "-"}</p>
            </div>
          ) : <p className="text-foreground/50">جاري التحميل...</p>}
        </GlassCard>
      </div>

      <GlassCard title="تحديث الموعد" subtitle="تغيير الحالة أو الملاحظات">
        <div className="grid gap-3 max-w-md">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass + " bg-[#0b1f19]"}>
            <option value="scheduled">مجدول</option>
            <option value="checked-in">تم التسجيل</option>
            <option value="in-progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغى</option>
            <option value="no-show">لم يحضر</option>
          </select>
          <input placeholder="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          <button onClick={handleUpdate} disabled={saving} className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60">
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
