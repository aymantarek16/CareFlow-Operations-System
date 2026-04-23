import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { routeByRole } from "@/lib/helpers";
import {
  Sparkles,
  Building2,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

// Lightweight animated frame around cards instead of heavy full-page background
function AnimatedFrame() {
  return (
    <div className="pointer-events-none absolute -inset-[2px] rounded-[28px] overflow-hidden">
      {/* Rotating gradient border */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, transparent, rgba(16,185,129,0.5), rgba(34,211,238,0.5), rgba(16,185,129,0.5), transparent)',
          animation: 'spin 10s linear infinite',
        }}
      />
      {/* Inner mask for border effect */}
      <div className="absolute inset-[2px] rounded-[26px] bg-background" />
      {/* Soft corner glows */}
      <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-emerald-500/25 blur-xl" />
      <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-cyan-500/25 blur-xl" />
    </div>
  );
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.role) {
      navigate(routeByRole(result.role), { replace: true });
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-0 md:overflow-visible">
      {/* Desktop: fixed center without scroll. Mobile: normal scroll */}
      <div className="md:fixed md:inset-0 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-5xl">
          {/* Container with animated frame around both cards */}
          <div className="relative">
            <AnimatedFrame />

            <div className="relative grid gap-4 md:gap-6 lg:grid-cols-[1.1fr,0.9fr] p-[2px]">
              {/* Left: info panel */}
              <div className="relative overflow-hidden rounded-[24px] bg-background/95 backdrop-blur-sm p-5 md:p-6 lg:p-7">
                <div className="absolute inset-x-0 top-0 h-24 md:h-32 bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 md:px-4 md:py-2 text-xs font-semibold uppercase tracking-[0.25em] md:tracking-[0.35em] text-primary">
                    <Sparkles size={12} className="md:w-[14px] md:h-[14px]" />
                    CareFlow Prime
                  </div>

                  <h1 className="mt-4 md:mt-5 max-w-xl text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-foreground">
                    <span className="block bg-gradient-to-r from-emerald-200 to-cyan-300 bg-clip-text text-transparent">
                      نظام CareFlow
                    </span>
                    لإدارة العيادات والمراكز الطبية
                  </h1>

                  <p className="mt-3 md:mt-4 text-xs md:text-sm leading-6 md:leading-7 text-foreground/60">
                    سجل دخولك بالبيانات التجريبية أدناه
                  </p>

                  {/* Fake Credentials For Testing */}
                  <div className="mt-3 md:mt-4 rounded-xl md:rounded-2xl border border-primary/30 bg-primary/10 p-3 md:p-4">
                    <p className="text-xs md:text-sm font-semibold text-primary">بيانات تجريبية :</p>
                    <div className="mt-2 grid gap-1.5 md:gap-2 text-[10px] md:text-xs text-foreground/80">
                      <p>
                        <span className="text-primary">أدمن :</span> admin@careflow.com / 12345678
                      </p>
                      <p>
                        <span className="text-primary">طبيب :</span> doctor@careflow.com / 12345678
                      </p>
                      <p>
                        <span className="text-primary">مريض :</span> patient@careflow.com / 12345678
                      </p>
                      <p>
                        <span className="text-primary">موظف استقبال :</span> receptionist@careflow.com / 12345678
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-4 grid gap-2 md:gap-3 grid-cols-2">
                    {[
                      {
                        icon: Building2,
                        title: "إدارة العيادة",
                        desc: "مواعيد، سجلات مرضى، فواتير بشكل منظم"
                      },
                      {
                        icon: ShieldCheck,
                        title: "حماية وأمان",
                        desc: "صلاحيات دقيقة + حماية البيانات بـ RLS"
                      },
                      {
                        icon: Stethoscope,
                        title: "لوحة الطبيب",
                        desc: "إدارة المواعيد، متابعة المرضى"
                      },
                      {
                        icon: HeartPulse,
                        title: "تجربة المريض",
                        desc: "حجز سريع، متابعة السجل الطبي بسهولة"
                      },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="rounded-xl md:rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3 md:p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                            <Icon size={14} className="md:w-4 md:h-4" />
                          </div>
                          <p className="text-xs md:text-sm font-semibold text-foreground">{title}</p>
                        </div>
                        <p className="mt-1 md:mt-1.5 text-[10px] md:text-xs leading-4 md:leading-5 text-foreground/55">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: form */}
              <div className="relative rounded-[24px] bg-background/95 backdrop-blur-sm p-5 md:p-6 lg:p-7 flex flex-col justify-center">
                <h2 className="text-xl md:text-2xl font-black text-foreground">تسجيل الدخول</h2>
                <p className="mt-2 text-xs md:text-sm text-foreground/55">أدخل بريدك الإلكتروني وكلمة المرور</p>

                <form onSubmit={handleSubmit} className="mt-5 md:mt-6 grid gap-3 md:gap-4">
                  <div>
                    <label className="mb-1 block text-xs md:text-sm text-foreground/70">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@careflow.com"
                      required
                      className="h-10 md:h-11 w-full rounded-xl md:rounded-2xl border border-foreground/10 bg-foreground/5 px-3 md:px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.07]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs md:text-sm text-foreground/70">كلمة المرور</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-10 md:h-11 w-full rounded-xl md:rounded-2xl border border-foreground/10 bg-foreground/5 px-3 md:px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.07]"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg md:rounded-xl bg-rose-400/10 px-3 md:px-4 py-2 text-xs md:text-sm text-rose-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </button>
                </form>

                <p className="mt-4 md:mt-5 text-center text-xs md:text-sm text-foreground/50">
                  ليس لديك حساب؟ <Link to="/register" className="text-primary hover:underline">إنشاء حساب</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe animation for spinning border */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}