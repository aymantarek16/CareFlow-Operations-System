import { useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppointments, useDoctors, usePatients } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation, useInsertMutation } from "@/hooks/useMutation";
import { formatDate, formatTime } from "@/lib/helpers";
import { formatSpecialtyBilingual } from "@/lib/specialties";
import type { AppointmentRecord } from "@/lib/types";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Plus, Search, CalendarPlus, Download } from "lucide-react";
import { toast } from "sonner";
import { generatePdfReport } from "@/lib/pdf";

const APPT_STATUS_LABEL: Record<string, string> = {
  scheduled: "مجدول",
  "checked-in": "تم التسجيل",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغى",
  "no-show": "لم يحضر",
};

export default function AdminAppointments() {
  const { data: appointments, loading, refetch } = useAppointments();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", appointment_date: "", appointment_time: "", status: "scheduled", reason: "", notes: "" });

  // Create state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  useEscapeClose(createModalOpen, () => setCreateModalOpen(false));
  
  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentRecord | null>(null);
  const [editForm, setEditForm] = useState({ status: "", notes: "" });
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState<AppointmentRecord | null>(null);

  const doctorMap = new Map(doctors.map((d) => [d.id, `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || d.id]));
  const patientMap = new Map(patients.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id]));

  const filtered = appointments.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    const name = `${patientMap.get(a.patient_id) ?? ""} ${doctorMap.get(a.doctor_id) ?? ""}`;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const { insertItem: createAppt, loading: createLoading } = useInsertMutation<AppointmentRecord>("appointments", {
    onSuccess: () => {
      refetch();
      setForm({ patient_id: "", doctor_id: "", appointment_date: "", appointment_time: "", status: "scheduled", reason: "", notes: "" });
      setCreateModalOpen(false);
    },
    successMessage: "تم إنشاء الموعد بنجاح",
  });

  const { deleteItem: deleteAppt, loading: deleteLoading } = useDeleteMutation<AppointmentRecord>("appointments", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingAppt(null);
    },
    successMessage: "تم حذف الموعد بنجاح",
  });
  
  const { updateItem: updateAppt, loading: updateLoading } = useUpdateMutation<AppointmentRecord>("appointments", {
    onSuccess: () => {
      refetch();
      setEditModalOpen(false);
      setEditingAppt(null);
    },
    successMessage: "تم تحديث الموعد بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAppt(form);
  };

  const handleEditClick = (appt: AppointmentRecord) => {
    setEditingAppt(appt);
    setEditForm({
      status: appt.status || "scheduled",
      notes: appt.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    await updateAppt(editingAppt.id, editForm);
  };

  const handleDeleteClick = (appt: AppointmentRecord) => {
    setDeletingAppt(appt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAppt) return;
    deleteAppt(deletingAppt.id);
  };

  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "تقرير المواعيد",
        subtitle:
          (statusFilter ? `حالة: ${APPT_STATUS_LABEL[statusFilter] ?? statusFilter}` : "كل المواعيد") +
          (search ? ` — بحث: ${search}` : ""),
        filename: `appointments-${new Date().toISOString().slice(0, 10)}`,
        meta: [{ label: "عدد المواعيد", value: filtered.length }],
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

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div>
      <PageHeader eyebrow="Admin / Scheduling" title="إدارة المواعيد" description="جدولة واضحة مع ربط مباشر بين المريض والطبيب." />
      
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input 
            placeholder="بحث..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={inputClass + " pr-10"} 
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass + " max-w-xs"}>
          <option value="">كل الحالات</option>
          <option value="scheduled">مجدول</option>
          <option value="checked-in">تم التسجيل</option>
          <option value="in-progress">قيد التنفيذ</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
          <option value="no-show">لم يحضر</option>
        </select>
      </div>

      <div className="grid gap-6">
        <GlassCard 
          title={`المواعيد (${filtered.length})`} 
          subtitle="جدول تشغيلي مباشر"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting || filtered.length === 0}
                className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {exporting ? "جاري التصدير..." : "تصدير PDF"}
              </button>
              <button type="button" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                <CalendarPlus className="h-3.5 w-3.5" />
                حجز موعد
              </button>
            </div>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : filtered.length === 0 ? (
            <EmptyState 
              variant={search || statusFilter ? "search" : "data"}
              action={
                (search || statusFilter) ? undefined : (
                  <button type="button" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    حجز أول موعد
                  </button>
                )
              }
            />
          ) : (
            <DataTable
              columns={["المريض", "الطبيب", "التاريخ", "الوقت", "الحالة", "الملاحظات", "الإجراءات"]}
              rows={filtered.map((a) => [
                patientMap.get(a.patient_id) ?? a.patient_id,
                doctorMap.get(a.doctor_id) ?? a.doctor_id,
                formatDate(a.appointment_date), formatTime(a.appointment_time),
                <StatusBadge key={a.id} status={a.status} />,
                a.notes ?? a.reason ?? "-",
                <div key={a.id} className="flex items-center gap-2">
                  <Link to={`/admin/appointments/${a.id}`} className="text-primary text-xs hover:underline">عرض</Link>
                  <button 
                    onClick={() => handleEditClick(a)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                    title="تعديل الحالة"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(a)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>,
              ])}
            />
          )}
        </GlassCard>
      </div>


      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">New Appointment</p>
                <h3 className="mt-2 text-xl font-bold text-foreground">حجز موعد جديد</h3>
                <p className="mt-1 text-sm text-foreground/55">اختر المريض والطبيب وحدد التاريخ والوقت.</p>
              </div>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-foreground/10">
                إغلاق
              </button>
            </div>

            {loading ? (
              <SkeletonForm fields={7} />
            ) : (
              <form onSubmit={handleCreate} className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className={selectClass} required>
                    <option value="">اختر المريض</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{`${p.first_name ?? ""} ${p.last_name ?? ""}`}</option>)}
                  </select>
                  <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className={selectClass} required>
                    <option value="">اختر الطبيب</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{`${d.first_name ?? ""} ${d.last_name ?? ""} — ${formatSpecialtyBilingual(d.specialty ?? "عام")}`}</option>)}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className={inputClass} required />
                  <input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} className={inputClass} required />
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                    <option value="scheduled">مجدول</option>
                    <option value="checked-in">تم التسجيل</option>
                    <option value="in-progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغى</option>
                  </select>
                </div>

                <input placeholder="سبب الزيارة" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} />
                <textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass + " min-h-[90px] resize-none py-3"} />

                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="h-11 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground hover:bg-foreground/10">
                    إلغاء
                  </button>
                  <button disabled={createLoading} type="submit" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60">
                    {createLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        جارٍ الحفظ...
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4" />
                        إضافة موعد
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-foreground">تحديث حالة الموعد</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-3">
              <select 
                value={editForm.status} 
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} 
                className={selectClass}
              >
                <option value="scheduled">مجدول</option>
                <option value="checked-in">تم التسجيل</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغى</option>
                <option value="no-show">لم يحضر</option>
              </select>
              <textarea 
                placeholder="ملاحظات" 
                value={editForm.notes} 
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} 
                className={inputClass + " min-h-[80px] py-3 resize-none"} 
              />
              <div className="mt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 h-11 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground hover:bg-foreground/10"
                >
                  إلغاء
                </button>
                <button 
                  disabled={updateLoading}
                  type="submit" 
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-background disabled:opacity-60"
                >
                  {updateLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="تأكيد حذف الموعد"
        description={`هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
