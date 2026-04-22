import { Activity, CalendarDays, Stethoscope, Users, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonStatCard, SkeletonCard } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminOverview } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";

export default function AdminDashboard() {
  const { loading, metrics, upcomingAppointments, recentPatients, doctors } = useAdminOverview();

  return (
    <div>
      <PageHeader eyebrow="Admin Control Center" title="مركز قيادة العمليات الطبية" description="أرقام تشغيلية مباشرة، مؤشرات يومية، ورؤية سريعة على المواعيد وحالة المنصة." />

      <div className="metric-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="إجمالي المرضى" value={metrics.patientsCount} hint="عدد ملفات المرضى المربوطة بالنظام" tone="cyan" icon={Users} />
            <StatCard title="إجمالي الأطباء" value={metrics.doctorsCount} hint={`يشمل ${metrics.specialties} تخصصات`} tone="emerald" icon={Stethoscope} />
            <StatCard title="مواعيد اليوم" value={metrics.todayAppointments} hint="مقاسة على تاريخ اليوم" tone="amber" icon={CalendarDays} />
            <StatCard title="معدل الإنجاز" value={`${metrics.completionRate}%`} hint="نسبة المواعيد المكتملة" tone="violet" icon={Activity} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <GlassCard title="المواعيد القادمة" subtitle="أقرب 8 مواعيد مسجلة في النظام">
          {loading ? (
            <SkeletonTable rows={5} columns={4} />
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState variant="data" title="لا توجد مواعيد" description="لم يتم حجز أي مواعيد بعد" />
          ) : (
            <DataTable
              columns={["التاريخ", "الوقت", "الحالة", "سبب الزيارة"]}
              rows={upcomingAppointments.map((item) => [
                formatDate(item.appointment_date),
                formatTime(item.appointment_time),
                <StatusBadge key={item.id} status={item.status} />,
                item.reason ?? "-",
              ])}
            />
          )}
        </GlassCard>

        <GlassCard title="صحة النظام" subtitle="قراءة سريعة على المشهد التشغيلي">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              [
                ["المواعيد المجدولة", metrics.scheduledCount, "جاهزة للتنفيذ"],
                ["المواعيد المكتملة", metrics.completedCount, "حركة فعلية تمت"],
                ["المواعيد الملغاة", metrics.cancelledCount, "قياس الالتزام"],
                ["المستخدمون", metrics.usersCount, "إجمالي الحسابات"],
                ["السجلات الطبية", metrics.medicalRecordsCount, "سجلات الزيارات"],
                ["الفواتير", metrics.invoicesCount, "جاهزة للتوسع المالي"],
              ].map(([label, value, desc]) => (
                <div key={String(label)} className="rounded-[24px] border border-foreground/10 bg-foreground/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{label}</p>
                    <span className="text-xl font-black text-foreground">{value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-foreground/52">{desc}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <GlassCard title="المرضى المضافون مؤخراً" subtitle="آخر ملفات دخلت النظام">
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : recentPatients.length === 0 ? (
              <EmptyState variant="data" title="لا يوجد مرضى" description="لم يتم إضافة أي مرضى بعد" />
            ) : (
              recentPatients.map((patient) => (
                <div key={patient.id} className="rounded-[24px] border border-foreground/10 bg-foreground/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{`${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "اسم غير مكتمل"}</p>
                      <p className="mt-1 text-sm text-foreground/52">{patient.phone ?? "لا يوجد رقم"}</p>
                    </div>
                    <span className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-foreground/65">{patient.gender ?? "غير محدد"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard title="الأطباء النشطون" subtitle="قائمة سريعة بالطاقم الطبي">
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : doctors.length === 0 ? (
              <EmptyState variant="data" title="لا يوجد أطباء" description="لم يتم إضافة أي أطباء بعد" />
            ) : (
              doctors.slice(0, 5).map((doc) => (
                <div key={doc.id} className="rounded-[24px] border border-foreground/10 bg-foreground/[0.03] p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{`${doc.first_name ?? ""} ${doc.last_name ?? ""}`.trim()}</p>
                    <p className="text-sm text-foreground/52">{doc.phone ?? "-"}</p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">{doc.specialty ?? "عام"}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
