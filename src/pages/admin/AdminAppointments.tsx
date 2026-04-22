import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, useDoctors, usePatients } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function AdminAppointments() {
  const { data: appointments, loading, refetch } = useAppointments();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", appointment_date: "", appointment_time: "", status: "scheduled", reason: "", notes: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const doctorMap = new Map(doctors.map((d) => [d.id, `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || d.id]));
  const patientMap = new Map(patients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id]));

  const filtered = appointments.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    const name = `${patientMap.get(a.patient_id) ?? ""} ${doctorMap.get(a.doctor_id) ?? ""}`;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setCreating(true);
    const { error } = await supabase.from("appointments").insert(form);
    if (error) setMsg(error.message);
    else { setMsg("تم إنشاء الموعد بنجاح"); refetch(); }
    setCreating(false);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div>
      <PageHeader eyebrow="Admin / Scheduling" title="إدارة المواعيد" description="جدولة واضحة مع ربط مباشر بين المريض والطبيب." />
      <div className="mb-4 flex flex-wrap gap-3">
        <input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass + " max-w-xs"} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass + " max-w-xs"}>
          <option value="">كل الحالات</option>
          <option value="scheduled">مجدول</option>
          <option value="checked-in">تم التسجيل</option>
          <option value="in-progress">قيد التنفيذ</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
          <option value="no-show">لم يحضر</option>
        </select>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <GlassCard title={`المواعيد (${filtered.length})`} subtitle="جدول تشغيلي مباشر">
          {loading ? <p className="text-foreground/50 py-8 text-center">جاري التحميل...</p> : (
            <DataTable
              columns={["المريض", "الطبيب", "التاريخ", "الوقت", "الحالة", "الملاحظات", ""]}
              rows={filtered.map((a) => [
                patientMap.get(a.patient_id) ?? a.patient_id,
                doctorMap.get(a.doctor_id) ?? a.doctor_id,
                formatDate(a.appointment_date), formatTime(a.appointment_time),
                <StatusBadge key={a.id} status={a.status} />,
                a.notes ?? a.reason ?? "-",
                <Link key={a.id + "l"} to={`/admin/appointments/${a.id}`} className="text-primary text-xs hover:underline">عرض</Link>,
              ])}
            />
          )}
        </GlassCard>
        <GlassCard title="إضافة موعد جديد" subtitle="حجز سريع">
          <form onSubmit={handleCreate} className="grid gap-3">
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className={selectClass} required>
              <option value="">اختر المريض</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{`${p.first_name ?? ""} ${p.last_name ?? ""}`}</option>)}
            </select>
            <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className={selectClass} required>
              <option value="">اختر الطبيب</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{`${d.first_name ?? ""} ${d.last_name ?? ""} — ${d.specialty ?? "عام"}`}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className={inputClass} required />
              <input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} className={inputClass} required />
            </div>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
              <option value="scheduled">مجدول</option>
              <option value="checked-in">تم التسجيل</option>
              <option value="in-progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغى</option>
            </select>
            <input placeholder="سبب الزيارة" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} />
            <input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
            {msg && <p className="text-sm text-foreground/70">{msg}</p>}
            <button disabled={creating} type="submit" className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background disabled:opacity-60">
              {creating ? "جارٍ الحفظ..." : "إضافة موعد"}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
