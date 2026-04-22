import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePatientOverview } from "@/hooks/useData";
import { useDoctors } from "@/hooks/useData";
import { supabase } from "@/lib/supabase";

export default function PatientBookAppointment() {
  const { patient } = usePatientOverview();
  const { data: doctors } = useDoctors();
  const [form, setForm] = useState({ doctor_id: "", appointment_date: "", appointment_time: "", reason: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setLoading(true); setMsg(null);
    const { error } = await supabase.from("appointments").insert({ ...form, patient_id: patient.id, status: "scheduled" });
    setMsg(error ? error.message : "تم حجز الموعد بنجاح!");
    setLoading(false);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Patient / Book" title="حجز موعد جديد" />
      <GlassCard title="نموذج الحجز" className="max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-3">
          <select value={form.doctor_id} onChange={(e) => setForm({...form, doctor_id: e.target.value})} className={inputClass + " bg-[#0b1f19]"} required>
            <option value="">اختر الطبيب</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{`${d.first_name??""} ${d.last_name??""} — ${d.specialty??"عام"}`}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.appointment_date} onChange={(e) => setForm({...form, appointment_date: e.target.value})} className={inputClass} required />
            <input type="time" value={form.appointment_time} onChange={(e) => setForm({...form, appointment_time: e.target.value})} className={inputClass} required />
          </div>
          <input placeholder="سبب الزيارة" value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className={inputClass} />
          {msg && <p className="text-sm text-foreground/70">{msg}</p>}
          <button type="submit" disabled={loading} className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background disabled:opacity-60">
            {loading ? "جارٍ الحجز..." : "حجز الموعد"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
