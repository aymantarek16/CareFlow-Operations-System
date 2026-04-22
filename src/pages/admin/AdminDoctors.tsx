import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { useDoctors } from "@/hooks/useData";
import { formatDateTime, splitName } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function AdminDoctors() {
  const { data: doctors, loading, refetch } = useDoctors();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", specialty: "", phone: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = doctors.filter((d) =>
    `${d.first_name} ${d.last_name} ${d.specialty}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.fullName, role: "doctor" } },
      });
      if (error) { setMsg(error.message); setCreating(false); return; }
      if (!data.user) { setMsg("فشل"); setCreating(false); return; }
      const uid = data.user.id;
      const names = splitName(form.fullName);
      await supabase.from("users").insert({ id: uid, name: form.fullName, email: form.email, role: "doctor" });
      await supabase.from("doctors").insert({ user_id: uid, first_name: names.firstName, last_name: names.lastName, specialty: form.specialty, phone: form.phone });
      setMsg("تم إنشاء حساب الطبيب بنجاح");
      setForm({ fullName: "", email: "", password: "", specialty: "", phone: "" });
      refetch();
    } catch (err) { setMsg(err instanceof Error ? err.message : "خطأ"); }
    setCreating(false);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Admin / Doctors" title="إدارة الطاقم الطبي" description="إنشاء حسابات أطباء وربطها بالمواعيد والمرضى." />
      <div className="mb-4">
        <input placeholder="بحث عن طبيب..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass + " max-w-md"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <GlassCard title={`الأطباء (${filtered.length})`} subtitle="بيانات من جدول doctors">
          {loading ? <p className="text-foreground/50 py-8 text-center">جاري التحميل...</p> : (
            <DataTable
              columns={["الاسم", "التخصص", "الهاتف", "تاريخ الإضافة", ""]}
              rows={filtered.map((d) => [
                `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "-",
                d.specialty ?? "-", d.phone ?? "-", formatDateTime(d.created_at),
                <Link key={d.id} to={`/admin/doctors/${d.id}`} className="text-primary text-xs hover:underline">عرض</Link>,
              ])}
            />
          )}
        </GlassCard>
        <GlassCard title="إضافة طبيب جديد" subtitle="ينشئ Auth + users + doctors">
          <form onSubmit={handleCreate} className="grid gap-3">
            <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className={inputClass} />
            <input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
            <input placeholder="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
            <input placeholder="التخصص" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required className={inputClass} />
            <input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className={inputClass} />
            {msg && <p className="text-sm text-foreground/70">{msg}</p>}
            <button disabled={creating} type="submit" className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background disabled:opacity-60">
              {creating ? "جاري الإنشاء..." : "إضافة طبيب"}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
