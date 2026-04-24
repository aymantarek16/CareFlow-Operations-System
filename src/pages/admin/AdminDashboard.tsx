import {
  Activity,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  XCircle,
  UserCog,
  ClipboardList,
  Receipt,
  Phone,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonStatCard, SkeletonCard } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminOverview } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { cn } from "@/lib/helpers";

type HealthTone = "emerald" | "cyan" | "violet" | "amber" | "rose" | "indigo";

const HEALTH_TONE: Record<HealthTone, { icon: string; ring: string; text: string; bar: string }> = {
  emerald: { icon: "bg-emerald-400/15 text-emerald-300", ring: "ring-emerald-400/25", text: "text-emerald-300", bar: "bg-emerald-400" },
  cyan:    { icon: "bg-cyan-400/15 text-cyan-300",       ring: "ring-cyan-400/25",    text: "text-cyan-300",    bar: "bg-cyan-400" },
  violet:  { icon: "bg-violet-400/15 text-violet-300",   ring: "ring-violet-400/25",  text: "text-violet-300",  bar: "bg-violet-400" },
  amber:   { icon: "bg-amber-400/15 text-amber-300",     ring: "ring-amber-400/25",   text: "text-amber-300",   bar: "bg-amber-400" },
  rose:    { icon: "bg-rose-400/15 text-rose-300",       ring: "ring-rose-400/25",    text: "text-rose-300",    bar: "bg-rose-400" },
  indigo:  { icon: "bg-indigo-400/15 text-indigo-300",   ring: "ring-indigo-400/25",  text: "text-indigo-300",  bar: "bg-indigo-400" },
};

function HealthRow({
  label,
  value,
  desc,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  desc: string;
  tone: HealthTone;
  icon: LucideIcon;
}) {
  const t = HEALTH_TONE[tone];
  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-3.5 pr-4 transition-all duration-200",
        "hover:-translate-y-0.5 hover:bg-foreground/[0.06]",
      )}
    >
      {/* side accent bar */}
      <span
        className={cn(
          "absolute inset-y-3 right-0 w-[3px] rounded-full opacity-70",
          t.bar,
        )}
      />
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
          t.icon,
          t.ring,
        )}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-semibold text-foreground">{label}</p>
          <span className={cn("text-2xl font-black tabular-nums leading-none", t.text)}>
            {value}
          </span>
        </div>
        <p className="mt-1 text-xs leading-6 text-foreground/55">{desc}</p>
      </div>
    </div>
  );
}

const GENDER_STYLE = {
  male:   { avatar: "bg-cyan-400/15 text-cyan-300 ring-cyan-400/25",     chip: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/25",     label: "ذكر" },
  female: { avatar: "bg-rose-400/15 text-rose-300 ring-rose-400/25",     chip: "bg-rose-400/10 text-rose-300 ring-rose-400/25",     label: "أنثى" },
  other:  { avatar: "bg-foreground/10 text-foreground/70 ring-foreground/15", chip: "bg-foreground/10 text-foreground/60 ring-foreground/15", label: "غير محدد" },
} as const;

function genderBucket(g?: string | null): keyof typeof GENDER_STYLE {
  const v = (g ?? "").toLowerCase();
  if (v === "male" || v === "m" || v.startsWith("ذك")) return "male";
  if (v === "female" || v === "f" || v.startsWith("أن") || v.startsWith("ان")) return "female";
  return "other";
}

function initials(first?: string | null, last?: string | null) {
  const f = (first ?? "").trim().charAt(0);
  const l = (last ?? "").trim().charAt(0);
  return (f + l || "؟").toUpperCase();
}

export default function AdminDashboard() {
  const { loading, metrics, upcomingAppointments, recentPatients, doctors } = useAdminOverview();

  return (
    <div>
      <PageHeader
        eyebrow="Admin Control Center"
        title="مركز قيادة العمليات الطبية"
        description="أرقام تشغيلية مباشرة، مؤشرات يومية، ورؤية سريعة على المواعيد وحالة المنصة."
      />

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
          <div className="space-y-2.5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              (
                [
                  { label: "المواعيد المجدولة", value: metrics.scheduledCount,      desc: "جاهزة للتنفيذ",      tone: "cyan",    icon: CalendarClock },
                  { label: "المواعيد المكتملة", value: metrics.completedCount,      desc: "حركة فعلية تمت",      tone: "emerald", icon: CheckCircle2 },
                  { label: "المواعيد الملغاة",  value: metrics.cancelledCount,      desc: "قياس الالتزام",      tone: "rose",    icon: XCircle },
                  { label: "المستخدمون",         value: metrics.usersCount,          desc: "إجمالي الحسابات",     tone: "indigo",  icon: UserCog },
                  { label: "السجلات الطبية",    value: metrics.medicalRecordsCount, desc: "سجلات الزيارات",     tone: "violet",  icon: ClipboardList },
                  { label: "الفواتير",           value: metrics.invoicesCount,       desc: "جاهزة للتوسع المالي", tone: "amber",   icon: Receipt },
                ] as Array<{ label: string; value: number; desc: string; tone: HealthTone; icon: LucideIcon }>
              ).map((row) => (
                <HealthRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  desc={row.desc}
                  tone={row.tone}
                  icon={row.icon}
                />
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <GlassCard title="المرضى المضافون مؤخراً" subtitle="آخر ملفات دخلت النظام">
          <div className="space-y-2.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : recentPatients.length === 0 ? (
              <EmptyState variant="data" title="لا يوجد مرضى" description="لم يتم إضافة أي مرضى بعد" />
            ) : (
              recentPatients.map((patient) => {
                const g = GENDER_STYLE[genderBucket(patient.gender)];
                const fullName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "اسم غير مكتمل";
                return (
                  <div
                    key={patient.id}
                    className="group flex items-center gap-4 rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/[0.06]"
                  >
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1", g.avatar)}>
                      {initials(patient.first_name, patient.last_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{fullName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/55">
                        <Phone size={12} />
                        <span className="truncate">{patient.phone ?? "لا يوجد رقم"}</span>
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", g.chip)}>
                      {g.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        <GlassCard title="الأطباء النشطون" subtitle="قائمة سريعة بالطاقم الطبي">
          <div className="space-y-2.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : doctors.length === 0 ? (
              <EmptyState variant="data" title="لا يوجد أطباء" description="لم يتم إضافة أي أطباء بعد" />
            ) : (
              doctors.slice(0, 5).map((doc) => {
                const fullName = `${doc.first_name ?? ""} ${doc.last_name ?? ""}`.trim() || "طبيب";
                return (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-4 rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/[0.06]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-emerald-300 ring-1 ring-emerald-400/25">
                      <Stethoscope size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">د. {fullName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/55">
                        <Phone size={12} />
                        <span className="truncate">{doc.phone ?? "-"}</span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/25">
                      {doc.specialty ?? "عام"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}