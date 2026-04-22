import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview } from "@/hooks/useData";
import { useDoctors } from "@/hooks/useData";
import { useInsertMutation } from "@/hooks/useMutation";
import { formatDate, formatTime } from "@/lib/helpers";
import { CalendarPlus, Stethoscope, Calendar, Clock } from "lucide-react";

export default function PatientBookAppointment() {
  const { patient, myAppointments, loading: overviewLoading } = usePatientOverview();
  const { data: doctors, loading: doctorsLoading } = useDoctors();
  const [form, setForm] = useState({ doctor_id: "", appointment_date: "", appointment_time: "", reason: "" });

  // Separate appointments by date
  const today = new Date().toISOString().slice(0, 10);
  const upcomingAppointments = myAppointments.filter((a) => a.appointment_date >= today && ["scheduled", "checked-in", "in-progress"].includes(a.status));
  const pastAppointments = myAppointments.filter((a) => a.appointment_date < today || ["completed", "cancelled", "no-show"].includes(a.status));

  // Get doctor name
  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? `${doctor.first_name} ${doctor.last_name}` : doctorId;
  };

  const { insertItem: createAppointment, loading: createLoading } = useInsertMutation("appointments", {
    onSuccess: () => {
      setForm({ doctor_id: "", appointment_date: "", appointment_time: "", reason: "" });
    },
    successMessage: "تم حجز الموعد بنجاح!",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    await createAppointment({
      ...form,
      patient_id: patient.id,
      status: "scheduled",
    });
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";
  const loading = overviewLoading || doctorsLoading;

  return (
    <div>
      <PageHeader eyebrow="Patient / Book" title="حجز موعد جديد" description="احجز موعدك مع الطبيب المختار" />

      <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
        {/* Upcoming Appointments */}
        <GlassCard
          title={`مواعيدي القادمة (${upcomingAppointments.length})`}
          subtitle="المواعيد المجدولة"
          action={
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <Calendar className="h-3.5 w-3.5" />
              المواعيد
            </button>
          }
        >
          {loading ? (
            <SkeletonTable rows={3} columns={5} />
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              variant="data"
              title="لا توجد مواعيد قادمة"
              description="ليس لديك مواعيد مجدولة حالياً"
            />
          ) : (
            <DataTable
              columns={["الطبيب", "التاريخ", "الوقت", "الحالة", "السبب"]}
              rows={upcomingAppointments.slice(0, 5).map((a) => [
                getDoctorName(a.doctor_id),
                formatDate(a.appointment_date),
                formatTime(a.appointment_time),
                <StatusBadge key={a.id} status={a.status} />,
                a.reason || "-",
              ])}
            />
          )}
        </GlassCard>

        {/* Booking Form */}
        <GlassCard title="حجز موعد جديد" subtitle="اختر الطبيب والتاريخ المناسب">
          {loading ? (
            <SkeletonForm fields={4} />
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-3">
              <div className="relative">
                <Stethoscope className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className={selectClass + " pr-10"}
                  required
                >
                  <option value="">اختر الطبيب</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {`${d.first_name ?? ""} ${d.last_name ?? ""} — ${d.specialty ?? "عام"}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                    className={inputClass + " pr-9"}
                    required
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="time"
                    value={form.appointment_time}
                    onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                    className={inputClass + " pr-9"}
                    required
                  />
                </div>
              </div>
              <input
                placeholder="سبب الزيارة (اختياري)"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={createLoading || !patient}
                className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    جارٍ الحجز...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4" />
                    حجز الموعد
                  </>
                )}
              </button>
            </form>
          )}
        </GlassCard>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <GlassCard title="المواعيد السابقة" subtitle={`${pastAppointments.length} موعد`} className="lg:col-span-2">
            <DataTable
              columns={["الطبيب", "التاريخ", "الوقت", "الحالة", "السبب"]}
              rows={pastAppointments.slice(0, 5).map((a) => [
                getDoctorName(a.doctor_id),
                formatDate(a.appointment_date),
                formatTime(a.appointment_time),
                <StatusBadge key={a.id} status={a.status} />,
                a.reason || "-",
              ])}
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
