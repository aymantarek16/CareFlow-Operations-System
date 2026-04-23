import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePatients, useDoctors } from "@/hooks/useData";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { toast } from "sonner";
import { CalendarPlus, X } from "lucide-react";

type AppointmentStatus =
  | "scheduled"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "مجدول" },
  { value: "checked-in", label: "تم التسجيل" },
  { value: "in-progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغى" },
  { value: "no-show", label: "لم يحضر" },
];

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  /** Optional pre-selected patient (e.g. when opened from a patient's page). */
  defaultPatientId?: string;
  /** Optional pre-selected doctor (e.g. when opened from a doctor's page). */
  defaultDoctorId?: string;
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  onCreated,
  defaultPatientId,
  defaultDoctorId,
}: CreateAppointmentDialogProps) {
  const { data: patients, loading: patientsLoading } = usePatients();
  const { data: doctors, loading: doctorsLoading } = useDoctors();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patient_id: defaultPatientId ?? "",
    doctor_id: defaultDoctorId ?? "",
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: "10:00",
    status: "scheduled" as AppointmentStatus,
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        patient_id: defaultPatientId ?? "",
        doctor_id: defaultDoctorId ?? "",
        appointment_date: new Date().toISOString().slice(0, 10),
        appointment_time: "10:00",
        status: "scheduled",
        reason: "",
        notes: "",
      });
    }
  }, [open, defaultPatientId, defaultDoctorId]);

  useEscapeClose(open, () => onOpenChange(false));

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) {
      toast.error("اختر المريض أولاً");
      return;
    }
    if (!form.doctor_id) {
      toast.error("اختر الطبيب أولاً");
      return;
    }
    if (!form.appointment_date || !form.appointment_time) {
      toast.error("حدد التاريخ والوقت");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      status: form.status,
      reason: form.reason || null,
      notes: form.notes || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("فشل إنشاء الموعد", { description: error.message });
      return;
    }

    toast.success("تم إنشاء الموعد بنجاح");
    onCreated?.();
    onOpenChange(false);
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";
  const loading = patientsLoading || doctorsLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-foreground/10 bg-[#0b1f19] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CalendarPlus className="h-5 w-5 text-primary" />
              موعد جديد
            </h3>
            <p className="mt-1 text-sm text-foreground/55">
              اختر المريض والطبيب وحدد التاريخ والوقت.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">المريض</label>
            <select
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              required
              disabled={loading}
              className={selectClass}
            >
              <option value="">{loading ? "جاري التحميل..." : "اختر المريض"}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(بدون اسم)"}
                  {p.phone ? ` — ${p.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">الطبيب</label>
            <select
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              required
              disabled={loading}
              className={selectClass}
            >
              <option value="">{loading ? "جاري التحميل..." : "اختر الطبيب"}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {`${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "(بدون اسم)"}
                  {d.specialty ? ` — ${d.specialty}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">التاريخ</label>
              <input
                type="date"
                value={form.appointment_date}
                onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground/70">الوقت</label>
              <input
                type="time"
                value={form.appointment_time}
                onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">الحالة</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">سبب الزيارة</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={inputClass}
              placeholder="كشف عام، متابعة، استشارة..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={inputClass + " h-auto py-3"}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-2xl border border-foreground/10 px-5 text-sm font-semibold text-foreground/70 hover:bg-foreground/5"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4" />
                  حفظ الموعد
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
