import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Sparkles, Building2, ShieldCheck, Stethoscope, HeartPulse } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] max-w-5xl w-full">
        {/* Left: info panel */}
        <div className="panel relative overflow-hidden rounded-[24px] p-6 lg:p-8">
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              <Sparkles size={14} />
              CareFlow Prime
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight text-foreground lg:text-5xl">
              <span className="block bg-gradient-to-r from-emerald-200 to-cyan-300 bg-clip-text text-transparent">نظام CareFlow</span>
              لإدارة العيادات والمراكز الطبية
            </h1>
            <p className="mt-5 text-sm leading-8 text-foreground/60">سجل دخولك بالبيانات التجريبية أدناه</p>

            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold text-primary">بيانات تجريبية :</p>
              <div className="mt-2 grid gap-2 text-xs text-foreground/80">
                <p><span className="text-primary">أدمن :</span> admin@careflow.com / 12345678</p>
                <p><span className="text-primary">طبيب :</span> doctor@careflow.com / 12345678</p>
                <p><span className="text-primary">مريض :</span> patient@careflow.com / 12345678</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { icon: Building2, title: "إدارة العيادة", desc: "حجز مواعيد، سجلات مرضى، فواتير" },
                { icon: ShieldCheck, title: "حماية وأمان", desc: "صلاحيات لكل دور + ربط آمن" },
                { icon: Stethoscope, title: "لوحة الدكتور", desc: "مواعيد، تشخيصات، متابعة حالات" },
                { icon: HeartPulse, title: "تجربة المريض", desc: "احجز موعد، شوف سجلك الطبي" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Icon size={18} /></div>
                    <p className="font-semibold text-foreground text-sm">{title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-foreground/55">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="login-glass rounded-[24px] p-6 lg:p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-foreground">تسجيل الدخول</h2>
          <p className="mt-2 text-sm text-foreground/55">أدخل بريدك الإلكتروني وكلمة المرور</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <div>
              <label className="text-sm text-foreground/70 mb-1 block">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@careflow.com"
                required
                className="h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.07]"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/70 mb-1 block">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.07]"
              />
            </div>

            {error && <p className="text-sm text-rose-400 bg-rose-400/10 rounded-xl px-4 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/50">
            ليس لديك حساب؟{" "}
            <Link to="/register" className="text-primary hover:underline">إنشاء حساب</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
