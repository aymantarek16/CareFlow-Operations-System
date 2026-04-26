import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDoctorOverview, useInvoices } from "@/hooks/useData";
import { formatDate, formatTime } from "@/lib/helpers";
import { formatMoney, invoiceRemaining } from "@/lib/billing";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function DoctorAppointments() {
  const { myAppointments, myPatients } = useDoctorOverview();
  const { data: invoices } = useInvoices();

  const pm = new Map(
    myPatients.map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id,
    ]),
  );

  // Visibility for doctor: invoices linked to their appointments will be
  // returned by RLS; we just render whatever shows up.
  const invoicesByAppointment = useMemo(() => {
    const map = new Map<string, (typeof invoices)[number]>();
    for (const inv of invoices) {
      if (inv.appointment_id) map.set(inv.appointment_id, inv);
    }
    return map;
  }, [invoices]);

  const renderPaymentCell = (appointmentId: string) => {
    const inv = invoicesByAppointment.get(appointmentId);
    if (!inv) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-[11px] text-foreground/60">
          <Clock className="h-3 w-3" />
          لا توجد فاتورة
        </span>
      );
    }
    if (inv.status === "cancelled" || inv.status === "refunded") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[11px] text-rose-300">
          <XCircle className="h-3 w-3" />
          ملغية
        </span>
      );
    }
    const remaining = invoiceRemaining(inv);
    if (remaining <= 0 && inv.status === "paid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          مدفوعة
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-300">
        <Clock className="h-3 w-3" />
        متبقي {formatMoney(remaining)}
      </span>
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Doctor / Appointments" title="جدول المواعيد" />
      <GlassCard title="المواعيد" subtitle="عرض حالة الدفع لكل موعد">
        <DataTable
          columns={[
            "المريض",
            "التاريخ",
            "الوقت",
            "الحالة",
            "الدفع",
            "السبب",
            "ملاحظات",
          ]}
          rows={myAppointments.map((a) => [
            pm.get(a.patient_id) ?? a.patient_id,
            formatDate(a.appointment_date),
            formatTime(a.appointment_time),
            <StatusBadge key={a.id} status={a.status} />,
            <div key={`pay-${a.id}`}>{renderPaymentCell(a.id)}</div>,
            a.reason ?? "-",
            a.notes ?? "-",
          ])}
        />
      </GlassCard>
    </div>
  );
}
