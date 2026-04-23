import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, usePatients, useDoctors } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { useState } from "react";
import { CalendarDays, Filter } from "lucide-react";
import { CreateAppointmentDialog } from "@/components/appointments/CreateAppointmentDialog";

export default function ReceptionistAppointments() {
  const { data: appointments, loading, refetch } = useAppointments();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const pm = new Map(patients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id]));
  const dm = new Map(doctors.map((d) => [d.id, `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || d.id]));
  const filtered = filter ? appointments.filter((a) => a.status === filter) : appointments;

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  const statusOptions = [
    { value: "", label: "كل الحالات" },
    { value: "scheduled", label: "مجدول" },
    { value: "checked-in", label: "تم التسجيل" },
    { value: "in-progress", label: "قيد التنفيذ" },
    { value: "completed", label: "مكتمل" },
    { value: "cancelled", label: "ملغى" },
    { value: "no-show", label: "لم يحضر" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Receptionist / Appointments" title="إدارة المواعيد" description="عرض وإدارة جميع المواعيد" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Filter className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={selectClass + " pr-10"}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <GlassCard
        title={`المواعيد (${filtered.length})`}
        subtitle="قائمة جميع المواعيد المجدولة"
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            موعد جديد
          </button>
        }
      >
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={filter ? "search" : "data"}
            title="لا توجد مواعيد"
            description={filter ? "لا توجد مواعيد مطابقة للفلتر" : "لم يتم حجز أي مواعيد بعد"}
            action={
              filter ? undefined : (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-background"
                >
                  <CalendarDays className="h-4 w-4" />
                  إنشاء أول موعد
                </button>
              )
            }
          />
        ) : (
          <DataTable
            columns={["المريض", "الطبيب", "التاريخ", "الوقت", "الحالة"]}
            rows={filtered.map((a) => [
              pm.get(a.patient_id) ?? "-",
              dm.get(a.doctor_id) ?? "-",
              formatDate(a.appointment_date),
              formatTime(a.appointment_time),
              <StatusBadge key={a.id} status={a.status} />,
            ])}
          />
        )}
      </GlassCard>

      <CreateAppointmentDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
}
