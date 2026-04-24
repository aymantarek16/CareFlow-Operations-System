import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonStatCard, SkeletonCard } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDoctorOverview } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatTime } from "@/lib/helpers";
import { formatSpecialtyBilingual } from "@/lib/specialties";
import { Activity, Users, FileText, Phone } from "lucide-react";

export default function DoctorDashboard() {
  const { appUser } = useAuth();
  const { doctor, myAppointments, myPatients, metrics } = useDoctorOverview();
  const patientMap = new Map(myPatients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id]));

  const isLoading = !doctor && !myAppointments.length && !myPatients.length;

  return (
    <div>
      <PageHeader eyebrow="Doctor Workspace" title={`أهلاً د. ${doctor?.first_name ?? appUser?.name}`} description="لوحة الطبيب مع المرضى المرتبطين والمواعيد القريبة." />
      <div className="metric-grid">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="إجمالي المواعيد" value={metrics.appointmentsCount} hint="كل المواعيد" tone="emerald" icon={Activity} />
            <StatCard title="عدد المرضى" value={metrics.patientsCount} hint="مرضى مرتبطون" tone="cyan" icon={Users} />
            <StatCard title="سجلات طبية" value={metrics.recordsCount} hint="ملاحظات وتشخيصات" tone="violet" icon={FileText} />
            <StatCard title="رقم التواصل" value={doctor?.phone ?? "-"} hint={doctor?.specialty ? formatSpecialtyBilingual(doctor.specialty) : "تخصص غير محدد"} tone="amber" icon={Phone} />
          </>
        )}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <GlassCard title="المواعيد القادمة" subtitle="الجدول التشغيلي للطبيب">
          {isLoading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : myAppointments.length === 0 ? (
            <EmptyState variant="data" title="لا توجد مواعيد" description="لم يتم حجز أي مواعيد لك بعد" />
          ) : (
            <DataTable columns={["المريض", "التاريخ", "الوقت", "الحالة", "السبب"]}
              rows={myAppointments.map((a) => [patientMap.get(a.patient_id) ?? a.patient_id, formatDate(a.appointment_date), formatTime(a.appointment_time), <StatusBadge key={a.id} status={a.status} />, a.reason ?? "-"])} />
          )}
        </GlassCard>
        <GlassCard title="المرضى المرتبطون" subtitle={`${myPatients.length} مريض`}>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : myPatients.length === 0 ? (
              <EmptyState variant="data" title="لا يوجد مرضى" description="لم يتم ربط أي مرضى بك بعد" />
            ) : (
              myPatients.map((p) => (
                <div key={p.id} className="rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-4">
                  <p className="font-semibold text-foreground">{`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()}</p>
                  <p className="text-sm text-foreground/50">{p.phone ?? "-"}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
