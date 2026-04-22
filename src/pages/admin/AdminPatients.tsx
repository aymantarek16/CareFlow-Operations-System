import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { usePatients } from "@/hooks/useData";
import { formatDateTime } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { splitName } from "@/lib/helpers";
import { Link } from "react-router-dom";

export default function AdminPatients() {
  const { data: patients, loading, refetch } = usePatients();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", gender: "male", dateOfBirth: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.fullName, role: "patient" } },
      });
      if (error) { setMsg(error.message); setCreating(false); return; }
      if (!data.user) { setMsg("فشل إنشاء الحساب"); setCreating(false); return; }
      const uid = data.user.id;
      const names = splitName(form.fullName);
      await supabase.from("users").insert({ id: uid, name: form.fullName, email: form.email, role: "patient" });
      await supabase.from("patients").insert({ user_id: uid, first_name: names.firstName, last_name: names.lastName, phone: form.phone, gender: form.gender, date_of_birth: form.dateOfBirth });
      setMsg("تم إنشاء حساب المريض بنجاح");
      setForm({ fullName: "", email: "", password: "", phone: "", gender: "male", dateOfBirth: "" });
      refetch();
    } catch (err) { setMsg(err instanceof Error ? err.message : "خطأ"); }
    setCreating(false);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Admin / Patients" title="إدارة ملفات المرضى" description="قائمة المرضى مع إمكانية البحث وإنشاء حسابات جديدة." />

      <div className="mb-4">
        <input placeholder="بحث عن مريض..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass + " max-w-md"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <GlassCard title={`المرضى (${filtered.length})`} subtitle="بيانات المرضى المسجلين">
          {loading ? <p className="text-foreground/50 py-8 text-center">جاري التحميل...</p> : (
            <DataTable
              columns={["الاسم", "الهاتف", "النوع", "تاريخ الميلاد", "تاريخ الإضافة", ""]}
              rows={filtered.map((p) => [
                `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "-",
                p.phone ?? "-",
                p.gender ?? "-",
                p.date_of_birth ?? "-",
                formatDateTime(p.created_at),
                <Link key={p.id} to={`/admin/patients/${p.id}`} className="text-primary text-xs hover:underline">عرض</Link>,
              ])}
            />
          )}
        </GlassCard>

        <GlassCard title="إضافة مريض جديد" subtitle="ينشئ الحساب تلقائياً">
          <form onSubmit={handleCreate} className="grid gap-3">
            <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className={inputClass} />
            <input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
            <input placeholder="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
            <input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className={inputClass} />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass + " bg-[#0b1f19]"}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required className={inputClass} />
            {msg && <p className="text-sm text-foreground/70 bg-foreground/5 rounded-xl px-4 py-2">{msg}</p>}
            <button disabled={creating} type="submit" className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background disabled:opacity-60">
              {creating ? "جاري الإنشاء..." : "إضافة مريض"}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
