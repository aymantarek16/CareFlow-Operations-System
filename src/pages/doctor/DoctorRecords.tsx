import { useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useMedicalRecords, usePatients, useDoctors } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation, useInsertMutation } from "@/hooks/useMutation";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/helpers";
import type { MedicalRecord } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, FileText, Stethoscope, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { generatePdfReport } from "@/lib/pdf";

export default function DoctorRecords() {
  const { appUser } = useAuth();
  const { data: doctors, loading: doctorsLoading } = useDoctors();
  const { data: patients, loading: patientsLoading } = usePatients();
  const { data: records, loading: recordsLoading, refetch } = useMedicalRecords();
  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("");

  // Get current doctor
  const doctor = doctors.find((d) => d.user_id === appUser?.id);
  
  // Filter records for this doctor only
  const myRecords = doctor ? records.filter((r) => r.doctor_id === doctor.id) : [];
  
  const filtered = myRecords.filter((r) => {
    const patient = patients.find((p) => p.id === r.patient_id);
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "";
    const matchesSearch = patientName.toLowerCase().includes(search.toLowerCase()) || 
                         r.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchesPatient = patientFilter ? r.patient_id === patientFilter : true;
    return matchesSearch && matchesPatient;
  });

  // Form state for creating new record
  const [form, setForm] = useState({ 
    patient_id: "", 
    diagnosis: "", 
    notes: "", 
    attachments: "" 
  });

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [editForm, setEditForm] = useState({ diagnosis: "", notes: "", attachments: "" });
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<MedicalRecord | null>(null);

  const { insertItem: createRecord, loading: createLoading } = useInsertMutation<MedicalRecord>("medical_records", {
    onSuccess: () => {
      refetch();
      setForm({ patient_id: "", diagnosis: "", notes: "", attachments: "" });
    },
    successMessage: "تم إضافة السجل الطبي بنجاح",
  });

  const { deleteItem: deleteRecord, loading: deleteLoading } = useDeleteMutation<MedicalRecord>("medical_records", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
    },
    successMessage: "تم حذف السجل الطبي بنجاح",
  });

  const { updateItem: updateRecord, loading: updateLoading } = useUpdateMutation<MedicalRecord>("medical_records", {
    onSuccess: () => {
      refetch();
      setEditModalOpen(false);
      setEditingRecord(null);
    },
    successMessage: "تم تحديث السجل الطبي بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;
    await createRecord({ 
      ...form, 
      doctor_id: doctor.id,
      patient_id: form.patient_id,
      diagnosis: form.diagnosis,
      notes: form.notes || null,
      attachments: form.attachments || null,
    });
  };

  const handleEditClick = (record: MedicalRecord) => {
    setEditingRecord(record);
    setEditForm({
      diagnosis: record.diagnosis || "",
      notes: record.notes || "",
      attachments: record.attachments || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    await updateRecord(editingRecord.id, editForm);
  };

  const handleDeleteClick = (record: MedicalRecord) => {
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRecord) return;
    deleteRecord(deletingRecord.id);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : patientId;
  };

  const doctorName = doctor
    ? `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim() || "—"
    : "—";

  const [exporting, setExporting] = useState(false);

  const printRecord = async (record: MedicalRecord) => {
    try {
      await generatePdfReport({
        title: "سجل طبي",
        subtitle: `رقم السجل: ${record.id.slice(0, 8)}`,
        filename: `medical-record-${record.id.slice(0, 8)}`,
        meta: [
          { label: "المريض", value: getPatientName(record.patient_id) },
          { label: "الطبيب المعالج", value: doctorName },
          { label: "تاريخ الإضافة", value: formatDateTime(record.created_at) },
        ],
        sections: [
          { heading: "التشخيص", body: record.diagnosis ?? "—" },
          { heading: "الوصفة / العلاج", body: record.prescription ?? "—" },
          { heading: "الملاحظات", body: record.notes ?? "—" },
        ],
        footer: "ملف طبي — للاستخدام الخاص بالمريض",
      });
      toast.success("تم تحميل السجل");
    } catch {
      toast.error("تعذّر إنشاء السجل");
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "تقرير السجلات الطبية",
        subtitle: `الطبيب: ${doctorName}`,
        filename: `medical-records-${new Date().toISOString().slice(0, 10)}`,
        meta: [{ label: "عدد السجلات", value: filtered.length }],
        table: {
          columns: ["المريض", "التشخيص", "الملاحظات", "تاريخ الإضافة"],
          rows: filtered.map((r) => [
            getPatientName(r.patient_id),
            r.diagnosis ?? "-",
            r.notes ?? "-",
            formatDateTime(r.created_at),
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
  const loading = doctorsLoading || patientsLoading || recordsLoading;

  return (
    <div>
      <PageHeader 
        eyebrow="Doctor / Records" 
        title="السجلات الطبية" 
        description="إدارة السجلات الطبية والتشخيصات للمرضى." 
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input 
            placeholder="بحث عن مريض أو تشخيص..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={inputClass + " pr-10"} 
          />
        </div>
        <select 
          value={patientFilter} 
          onChange={(e) => setPatientFilter(e.target.value)} 
          className={selectClass + " max-w-xs"}
        >
          <option value="">كل المرضى</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <GlassCard 
          title={`سجلاتي الطبية (${filtered.length})`} 
          subtitle="السجلات الطبية المرتبطة بك"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportAll}
                disabled={exporting || filtered.length === 0}
                className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {exporting ? "جاري التصدير..." : "تصدير PDF"}
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                <FileText className="h-3.5 w-3.5" />
                سجل جديد
              </button>
            </div>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState 
              variant={search || patientFilter ? "search" : "data"}
              title="لا توجد سجلات طبية"
              description={search || patientFilter ? "لا توجد نتائج مطابقة للبحث" : "لم تقم بإضافة أي سجلات طبية بعد"}
            />
          ) : (
            <DataTable
              columns={["المريض", "التشخيص", "الملاحظات", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((r) => [
                getPatientName(r.patient_id),
                <span key={r.id + "diag"} className="line-clamp-2 max-w-[200px]" title={r.diagnosis || "-"}>
                  {r.diagnosis || "-"}
                </span>,
                <span key={r.id + "notes"} className="line-clamp-2 max-w-[150px] text-foreground/60" title={r.notes || "-"}>
                  {r.notes || "-"}
                </span>,
                formatDateTime(r.created_at),
                <div key={r.id} className="flex items-center gap-2">
                  <button 
                    onClick={() => printRecord(r)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                    title="طباعة PDF"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleEditClick(r)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(r)}
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

        <GlassCard title="إضافة سجل طبي جديد" subtitle="تسجيل تشخيص جديد">
          {loading ? (
            <SkeletonForm fields={4} />
          ) : (
            <form onSubmit={handleCreate} className="grid gap-3">
              <select 
                value={form.patient_id} 
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })} 
                className={selectClass} 
                required
              >
                <option value="">اختر المريض</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`}</option>
                ))}
              </select>
              <input 
                placeholder="التشخيص" 
                value={form.diagnosis} 
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} 
                required 
                className={inputClass} 
              />
              <textarea 
                placeholder="الملاحظات الطبية" 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                className={inputClass + " min-h-[100px] py-3 resize-none"} 
              />
              <input 
                placeholder="رابط المرفقات (اختياري)" 
                value={form.attachments} 
                onChange={(e) => setForm({ ...form, attachments: e.target.value })} 
                className={inputClass} 
              />
              <button 
                disabled={createLoading || !doctor}
                type="submit" 
                className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4" />
                    إضافة سجل طبي
                  </>
                )}
              </button>
            </form>
          )}
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-foreground">تعديل السجل الطبي</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-3">
              <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-3">
                <p className="text-xs text-foreground/50">المريض</p>
                <p className="font-semibold text-foreground">{getPatientName(editingRecord.patient_id)}</p>
              </div>
              <input 
                placeholder="التشخيص" 
                value={editForm.diagnosis} 
                onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })} 
                required
                className={inputClass} 
              />
              <textarea 
                placeholder="الملاحظات الطبية" 
                value={editForm.notes} 
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} 
                className={inputClass + " min-h-[100px] py-3 resize-none"} 
              />
              <input 
                placeholder="رابط المرفقات" 
                value={editForm.attachments} 
                onChange={(e) => setEditForm({ ...editForm, attachments: e.target.value })} 
                className={inputClass} 
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
        title="تأكيد حذف السجل الطبي"
        description="هل أنت متأكد من حذف هذا السجل الطبي؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
