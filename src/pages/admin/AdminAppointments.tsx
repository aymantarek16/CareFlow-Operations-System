import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, useDoctors, usePatients } from "@/hooks/useData";
import { useDeleteMutation, useInsertMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDate, formatTime } from "@/lib/helpers";
import { formatSpecialtyBilingual } from "@/lib/specialties";
import { generatePdfReport } from "@/lib/pdf";
import type { AppointmentRecord } from "@/lib/types";

const APPT_STATUS_LABEL: Record<string, string> = {
  scheduled: "مجدول",
  "checked-in": "تم التسجيل",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغى",
  "no-show": "لم يحضر",
};

const emptyForm = {
  patient_id: "",
  doctor_id: "",
  appointment_date: "",
  appointment_time: "",
  status: "scheduled",
  reason: "",
  notes: "",
};

type AppointmentFormState = typeof emptyForm;

export default function AdminAppointments() {
  const { data: appointments, loading, refetch } = useAppointments();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<AppointmentFormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState<AppointmentRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  useEscapeClose(modalOpen, () => closeModal());

  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || d.id])),
    [doctors],
  );

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id])),
    [patients],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      if (statusFilter && appointment.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      const searchable = [
        patientMap.get(appointment.patient_id),
        doctorMap.get(appointment.doctor_id),
        appointment.reason,
        appointment.notes,
        APPT_STATUS_LABEL[appointment.status ?? ""],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [appointments, doctorMap, patientMap, search, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: appointments.length,
      today: appointments.filter((a) => a.appointment_date === today).length,
      scheduled: appointments.filter((a) => a.status === "scheduled").length,
      completed: appointments.filter((a) => a.status === "completed").length,
    };
  }, [appointments]);

  const { insertItem: createAppt, loading: createLoading } = useInsertMutation<AppointmentRecord>("appointments", {
    onSuccess: () => {
      refetch();
      closeModal();
    },
    successMessage: "تم إنشاء الموعد بنجاح",
  });

  const { updateItem: updateAppt, loading: updateLoading } = useUpdateMutation<AppointmentRecord>("appointments", {
    onSuccess: () => {
      refetch();
      closeModal();
    },
    successMessage: "تم تحديث الموعد بنجاح",
  });

  const { deleteItem: deleteAppt, loading: deleteLoading } = useDeleteMutation<AppointmentRecord>("appointments", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingAppt(null);
    },
    successMessage: "تم حذف الموعد بنجاح",
  });

  function openCreateModal() {
    setEditingAppt(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(appt: AppointmentRecord) {
    setEditingAppt(appt);
    setForm({
      patient_id: appt.patient_id ?? "",
      doctor_id: appt.doctor_id ?? "",
      appointment_date: appt.appointment_date ?? "",
      appointment_time: appt.appointment_time ?? "",
      status: appt.status ?? "scheduled",
      reason: appt.reason ?? "",
      notes: appt.notes ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingAppt(null);
    setForm(emptyForm);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.patient_id || !form.doctor_id || !form.appointment_date || !form.appointment_time) {
      toast.error("من فضلك أكمل بيانات الموعد الأساسية");
      return;
    }

    if (editingAppt) {
      await updateAppt(editingAppt.id, form);
      return;
    }

    await createAppt(form);
  };

  const handleDeleteClick = (appt: AppointmentRecord) => {
    setDeletingAppt(appt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAppt) return;
    deleteAppt(deletingAppt.id);
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "تقرير المواعيد",
        subtitle:
          (statusFilter ? `حالة: ${APPT_STATUS_LABEL[statusFilter] ?? statusFilter}` : "كل المواعيد") +
          (search ? ` — بحث: ${search}` : ""),
        filename: `appointments-${new Date().toISOString().slice(0, 10)}`,
        meta: [
          { label: "عدد المواعيد", value: filtered.length },
          { label: "المجدولة", value: stats.scheduled },
          { label: "المكتملة", value: stats.completed },
        ],
        table: {
          columns: ["المريض", "الطبيب", "التاريخ", "الوقت", "الحالة", "السبب", "ملاحظات"],
          rows: filtered.map((a) => [
            patientMap.get(a.patient_id) ?? "-",
            doctorMap.get(a.doctor_id) ?? "-",
            formatDate(a.appointment_date),
            formatTime(a.appointment_time),
            APPT_STATUS_LABEL[a.status ?? ""] ?? a.status ?? "-",
            a.reason ?? "-",
            a.notes ?? "-",
          ]),
        },
      });
      toast.success("تم تحميل التقرير");
    } catch {
      toast.error("تعذّر إنشاء ملف PDF");
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-primary/50 focus:bg-foreground/[0.07]";
  const selectClass = inputClass + " bg-[#0b1f19]";
  const textareaClass = inputClass + " min-h-[96px] resize-none py-3";
  const busy = createLoading || updateLoading;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin / Scheduling" title="إدارة المواعيد" description="جدولة واضحة مع ربط مباشر بين المريض والطبيب." />

      <div className="grid gap-3 md:grid-cols-4">
        <GlassCard title="كل المواعيد" subtitle={`${stats.total} موعد`} />
        <GlassCard title="مواعيد اليوم" subtitle={`${stats.today} موعد`} />
        <GlassCard title="مجدولة" subtitle={`${stats.scheduled} موعد`} />
        <GlassCard title="مكتملة" subtitle={`${stats.completed} موعد`} />
      </div>

      <GlassCard
        title={`المواعيد (${filtered.length})`}
        subtitle="جدول تشغيلي مباشر بكامل المساحة"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              حجز موعد
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting || filtered.length === 0}
              className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "جاري التصدير..." : "تصدير PDF"}
            </button>
          </div>
        }
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr,240px]">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="ابحث باسم المريض أو الطبيب أو السبب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass + " pr-10"}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">كل الحالات</option>
            {Object.entries(APPT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search || statusFilter ? "search" : "data"}
            action={
              search || statusFilter ? undefined : (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  حجز أول موعد
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-background/20">
            <DataTable
              columns={["المريض", "الطبيب", "التاريخ", "الوقت", "الحالة", "السبب / الملاحظات", "الإجراءات"]}
              rows={filtered.map((a) => [
                <span key={`patient-${a.id}`} className="font-semibold text-foreground">
                  {patientMap.get(a.patient_id) ?? a.patient_id}
                </span>,
                <span key={`doctor-${a.id}`} className="text-foreground/80">
                  {doctorMap.get(a.doctor_id) ?? a.doctor_id}
                </span>,
                formatDate(a.appointment_date),
                formatTime(a.appointment_time),
                <StatusBadge key={`status-${a.id}`} status={a.status} />,
                <div key={`notes-${a.id}`} className="max-w-[260px] text-xs leading-6 text-foreground/70">
                  <p className="line-clamp-1">{a.reason || "-"}</p>
                  {a.notes ? <p className="line-clamp-1 text-foreground/45">{a.notes}</p> : null}
                </div>,
                <div key={`actions-${a.id}`} className="flex items-center gap-2">
                  <Link to={`/admin/appointments/${a.id}`} className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                    عرض
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400 transition hover:bg-rose-400/20"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>,
              ])}
            />
          </div>
        )}
      </GlassCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-foreground/10 bg-background/95 p-5 shadow-2xl md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">Appointment Modal</p>
                <h3 className="mt-2 text-xl font-black text-foreground">{editingAppt ? "تعديل الموعد" : "حجز موعد جديد"}</h3>
                <p className="mt-1 text-sm text-foreground/55">اكتب بيانات الموعد بالكامل من غير ما تزحم صفحة الجدول.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                  المريض
                  <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className={selectClass} required>
                    <option value="">اختر المريض</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                  الطبيب
                  <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className={selectClass} required>
                    <option value="">اختر الطبيب</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {`${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || d.id} — {formatSpecialtyBilingual(d.specialty ?? "عام")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                  التاريخ
                  <input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className={inputClass} required />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                  الوقت
                  <input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} className={inputClass} required />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                  الحالة
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                    {Object.entries(APPT_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                سبب الزيارة
                <input placeholder="مثال: كشف، متابعة، استشارة..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-foreground/75">
                ملاحظات
                <textarea placeholder="أي ملاحظات إضافية عن الموعد" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={textareaClass} />
              </label>

              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
                >
                  إلغاء
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4" />
                      {editingAppt ? "حفظ التغييرات" : "إضافة الموعد"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="تأكيد حذف الموعد"
        description="هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
