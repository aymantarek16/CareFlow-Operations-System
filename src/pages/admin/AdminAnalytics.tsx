import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { SkeletonCard, SkeletonStatCard } from "@/components/ui/SkeletonTable";
import { useAdminOverview } from "@/hooks/useData";
import { Users, Stethoscope, CalendarDays, Activity, TrendingUp, BarChart3 } from "lucide-react";

export default function AdminAnalytics() {
  const { metrics, loading } = useAdminOverview();

  return (
    <div>
      <PageHeader eyebrow="Admin / Analytics" title="التحليلات والتقارير" description="رؤية شاملة على أداء النظام والمؤشرات التشغيلية." />

      <div className="metric-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="إجمالي المرضى" value={metrics.patientsCount} hint="ملفات نشطة" tone="cyan" icon={Users} />
            <StatCard title="إجمالي الأطباء" value={metrics.doctorsCount} hint={`${metrics.specialties} تخصص`} tone="emerald" icon={Stethoscope} />
            <StatCard title="إجمالي المواعيد" value={metrics.appointmentsCount} hint="كل المواعيد" tone="amber" icon={CalendarDays} />
            <StatCard title="معدل الإنجاز" value={`${metrics.completionRate}%`} hint="المواعيد المكتملة" tone="violet" icon={Activity} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="حالات المواعيد">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              [
                ["مجدولة", metrics.scheduledCount, "border-cyan-400/20 bg-cyan-400/10"],
                ["مكتملة", metrics.completedCount, "border-emerald-400/20 bg-emerald-400/10"],
                ["ملغاة", metrics.cancelledCount, "border-rose-400/20 bg-rose-400/10"],
              ].map(([label, value, cls]) => (
                <div key={String(label)} className={`rounded-2xl border p-4 ${cls}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{label}</p>
                    <span className="text-2xl font-black text-foreground">{value}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard title="مؤشرات عامة">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              ([
                { label: "المستخدمون", value: metrics.usersCount, Icon: TrendingUp },
                { label: "السجلات الطبية", value: metrics.medicalRecordsCount, Icon: BarChart3 },
                { label: "الفواتير", value: metrics.invoicesCount, Icon: Activity },
              ] as const).map(({ label, value, Icon }) => (
                <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      {typeof Icon === "function" && <Icon size={18} />}
                    </div>
                    <p className="font-semibold text-foreground">{label}</p>
                  </div>
                  <span className="text-xl font-black text-foreground">{value}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard title="مواعيد اليوم">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-32 animate-pulse rounded-xl bg-foreground/10" />
              <div className="mt-3 h-4 w-40 animate-pulse rounded bg-foreground/10" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-5xl font-black text-primary">{metrics.todayAppointments}</p>
              <p className="mt-3 text-sm text-foreground/55">موعد مسجل لهذا اليوم</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
