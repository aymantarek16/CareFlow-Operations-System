import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSettings() {
  const { appUser } = useAuth();

  return (
    <div>
      <PageHeader eyebrow="Admin / Settings" title="إعدادات النظام" description="تكوين النظام وتفضيلات الإدارة." />

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard title="معلومات النظام" subtitle="بيانات المنصة">
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">اسم النظام</p>
              <p className="mt-1 font-semibold text-foreground">CareFlow Medical Operations</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">الإصدار</p>
              <p className="mt-1 font-semibold text-foreground">2.0.0</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">البيئة</p>
              <p className="mt-1 font-semibold text-foreground">Production</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="حساب المدير" subtitle="بيانات الحساب الحالي">
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">الاسم</p>
              <p className="mt-1 font-semibold text-foreground">{appUser?.name ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">البريد</p>
              <p className="mt-1 font-semibold text-foreground">{appUser?.email ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">الدور</p>
              <p className="mt-1 font-semibold text-foreground">{appUser?.role ?? "-"}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="الوحدات المتاحة" subtitle="قائمة الوحدات النشطة في النظام" className="md:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { name: "إدارة المرضى", status: "نشط" },
              { name: "إدارة الأطباء", status: "نشط" },
              { name: "المواعيد", status: "نشط" },
              { name: "الفواتير", status: "نشط" },
              { name: "السجلات الطبية", status: "نشط" },
              { name: "التحليلات", status: "نشط" },
              { name: "الوصفات الطبية", status: "قريباً" },
              { name: "المختبر", status: "قريباً" },
              { name: "الأشعة", status: "قريباً" },
            ].map((mod) => (
              <div key={mod.name} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 flex items-center justify-between">
                <p className="font-semibold text-foreground text-sm">{mod.name}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mod.status === "نشط" ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border border-foreground/10 bg-foreground/5 text-foreground/50"}`}>
                  {mod.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
