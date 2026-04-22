import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { splitName } from "@/lib/helpers";
import { Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", gender: "male", dateOfBirth: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.fullName, role: "patient" } },
      });

      if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }
      if (!data.user) { setError("فشل إنشاء الحساب"); setLoading(false); return; }

      const userId = data.user.id;
      const names = splitName(form.fullName);

      // Insert into users table
      const { error: usersErr } = await supabase.from("users").insert({
        id: userId, name: form.fullName, email: form.email, role: "patient",
      });

      if (usersErr) { setError(usersErr.message); setLoading(false); return; }

      // Insert into patients table
      const { error: patientsErr } = await supabase.from("patients").insert({
        user_id: userId,
        first_name: names.firstName,
        last_name: names.lastName,
        phone: form.phone,
        gender: form.gender,
        date_of_birth: form.dateOfBirth,
      });

      if (patientsErr) { setError(patientsErr.message); setLoading(false); return; }

      // Auto sign-in
      const { error: loginErr } = await signIn(form.email, form.password);
      if (loginErr) {
        navigate("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    }
    setLoading(false);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.07]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="login-glass rounded-[24px] p-6 lg:p-8 max-w-lg w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary mb-6">
          <Sparkles size={14} />
          CareFlow
        </div>
        <h2 className="text-2xl font-black text-foreground">إنشاء حساب مريض</h2>
        <p className="mt-2 text-sm text-foreground/55">سجل بياناتك للحصول على حساب في النظام</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
          <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className={inputClass} />
          <input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
          <input placeholder="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
          <input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className={inputClass} />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass + " bg-[#0b1f19]"}>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
          <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required className={inputClass} />

          {error && <p className="text-sm text-rose-400 bg-rose-400/10 rounded-xl px-4 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background transition hover:brightness-110 disabled:opacity-60">
            {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/50">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="text-primary hover:underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
