import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, usePatients } from "@/hooks/useData";
import { useUpdateMutation } from "@/hooks/useMutation";
import { formatTime, formatDate } from "@/lib/helpers";
import { CheckCircle2, CalendarCheck, UserCheck } from "lucide-react";

export default function ReceptionistCheckIn() {
  const { data: appointments, loading, refetch } = useAppointments();
  const { data: patients, loading: patientsLoading } = usePatients();
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const pm = new Map(patients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id]));

  const { updateItem: updateAppointment, loading: updating } = useUpdateMutation("appointments", {
    onSuccess: () => {
      refetch();
    },
    successMessage: "تم تسجيل حضور المريض بنجاح",
  });

  const checkIn = async (id: string) => {
    await updateAppointment(id, { status: "checked-in" });
  };

  const isLoading = loading || patientsLoading;

  return (
    <div>
      <PageHeader
        eyebrow="Receptionist / Check-in"
        title="تسجيل حضور المرضى"
        description="سجل حضور المرضى لمواعيد اليوم"
      />

      {/* Today's Summary */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">مواعيد اليوم</p>
          <p className="text-2xl font-bold text-foreground">{todayAppts.length}</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">بانتظار الحضور</p>
          <p className="text-2xl font-bold text-emerald-400">
            {todayAppts.filter((a) => a.status === "scheduled").length}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">تم التسجيل</p>
          <p className="text-2xl font-bold text-blue-400">
            {todayAppts.filter((a) => a.status === "checked-in").length}
          </p>
        </div>
      </div>

      <GlassCard
        title={`مواعيد اليوم (${todayAppts.length})`}
        subtitle={formatDate(today)}
        action={
          <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
            <CalendarCheck className="h-3.5 w-3.5" />
            {formatDate(today)}
          </button>
        }
      >
        {isLoading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : todayAppts.length === 0 ? (
          <EmptyState
            variant="data"
            title="لا توجد مواعيد لليوم"
            description="لا يوجد أي مواعيد مجدولة لليوم"
            action={
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white">
                <UserCheck className="h-4 w-4" />
                عرض جميع المواعيد
              </button>
            }
          />
        ) : (
          <DataTable
            columns={["المريض", "الوقت", "الحالة", "إجراء"]}
            rows={todayAppts.map((a) => [
              pm.get(a.patient_id) ?? "-",
              formatTime(a.appointment_time),
              <StatusBadge key={a.id} status={a.status} />,
              a.status === "scheduled" ? (
                <button
                  key={a.id + "b"}
                  onClick={() => checkIn(a.id)}
                  disabled={updating}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {updating ? "جارٍ..." : "تسجيل حضور"}
                </button>
              ) : (
                <span key={a.id + "s"} className="text-xs text-foreground/40">—</span>
              ),
            ])}
          />
        )}
      </GlassCard>
    </div>
  );
}
