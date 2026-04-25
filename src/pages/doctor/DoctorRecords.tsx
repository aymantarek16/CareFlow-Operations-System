import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useMedicalRecords, usePatients, useDoctors } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation, useInsertMutation } from "@/hooks/useMutation";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/helpers";
import type { MedicalRecord } from "@/lib/types";
import { Pencil, Trash2, Search, FileText, Printer, Download, X, Save, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { generatePdfReport } from "@/lib/pdf";
import { z } from "zod";
import { optionalMultilineSchema, safeValidate, shortTextSchema } from "@/lib/validation";

const medicalRecordSchema = z.object({
  patient_id: z.string().uuid("مريض غير صالح"),
  diagnosis: shortTextSchema(500),
  notes: optionalMultilineSchema(4000),
  attachments: optionalMultilineSchema(2000),
});

const editMedicalRecordSchema = z.object({
  diagnosis: shortTextSchema(500),
  notes: optionalMultilineSchema(4000),
  attachments: optionalMultilineSchema(2000),
});

type RecordFormState = {
  patient_id: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  attachments: string;
};

const emptyForm: RecordFormState = {
  patient_id: "",
  diagnosis: "",
  prescription: "",
  notes: "",
  attachments: "",
};

export default function DoctorRecords() {
  const { appUser } = useAuth();
  const { data: doctors, loading: doctorsLoading } = useDoctors();
  const { data: patients, loading: patientsLoading } = usePatients();
  const { data: records, loading: recordsLoading, refetch } = useMedicalRecords();

  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState<RecordFormState>(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<MedicalRecord | null>(null);

  const loading = doctorsLoading || patientsLoading || recordsLoading;

  const doctor = useMemo(
    () => doctors.find((d) => d.user_id === appUser?.id),
    [doctors, appUser?.id]
  );

  const doctorName = doctor
    ? `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim() || "—"
    : "—";

  const patientsById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.id, patient]));
  }, [patients]);

  const getPatientName = (patientId: string) => {
    const patient = patientsById.get(patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : patientId;
  };

  const myRecords = useMemo(() => {
    if (!doctor) return [];
    return records.filter((record) => record.doctor_id === doctor.id);
  }, [doctor, records]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return myRecords.filter((record) => {
      const patientName = getPatientName(record.patient_id).toLowerCase();
      const diagnosis = record.diagnosis?.toLowerCase() ?? "";
      const notes = record.notes?.toLowerCase() ?? "";
      const prescription = record.prescription?.toLowerCase() ?? "";

      const matchesSearch = normalizedSearch
        ? patientName.includes(normalizedSearch) ||
          diagnosis.includes(normalizedSearch) ||
          notes.includes(normalizedSearch) ||
          prescription.includes(normalizedSearch)
        : true;

      const matchesPatient = patientFilter ? record.patient_id === patientFilter : true;
      return matchesSearch && matchesPatient;
    });
  }, [myRecords, patientFilter, search, patientsById]);

  useEscapeClose(recordModalOpen, () => closeRecordModal());

  const { insertItem: createRecord, loading: createLoading } = useInsertMutation<MedicalRecord>("medical_records", {
    onSuccess: () => {
      refetch();
      closeRecordModal();
    },
    successMessage: "تم إضافة السجل الطبي بنجاح",
  });

  const { updateItem: updateRecord, loading: updateLoading } = useUpdateMutation<MedicalRecord>("medical_records", {
    onSuccess: () => {
      refetch();
      closeRecordModal();
    },
    successMessage: "تم تحديث السجل الطبي بنجاح",
  });

  const { deleteItem: deleteRecord, loading: deleteLoading } = useDeleteMutation<MedicalRecord>("medical_records", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
    },
    successMessage: "تم حذف السجل الطبي بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    const validation = safeValidate(medicalRecordSchema, form);
    if (!validation.data) {
      toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
      return;
    }
    const clean = validation.data;

    await createRecord({
      doctor_id: doctor.id,
      patient_id: clean.patient_id,
      diagnosis: clean.diagnosis,
      notes: clean.notes || null,
      attachments: clean.attachments || null,
    });
  const openCreateModal = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setRecordModalOpen(true);
  };

  const openEditModal = (record: MedicalRecord) => {
    setEditingRecord(record);
    setForm({
      patient_id: record.patient_id,
      diagnosis: record.diagnosis || "",
      prescription: record.prescription || "",
      notes: record.notes || "",
      attachments: record.attachments || "",
    });
    setRecordModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const validation = safeValidate(editMedicalRecordSchema, editForm);
    if (!validation.data) {
      toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
      return;
    }
    await updateRecord(editingRecord.id, validation.data);
  function closeRecordModal() {
    setRecordModalOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!doctor) {
      toast.error("لم يتم العثور على حساب الطبيب الحالي");
      return;
    }

    const payload = {
      patient_id: form.patient_id,
      diagnosis: form.diagnosis.trim(),
      prescription: form.prescription.trim() || null,
      notes: form.notes.trim() || null,
      attachments: form.attachments.trim() || null,
    };

    if (editingRecord) {
      await updateRecord(editingRecord.id, payload);
      return;
    }

    await createRecord({
      ...payload,
      doctor_id: doctor.id,
    });
  };

  const handleDeleteClick = (record: MedicalRecord) => {
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRecord) return;
    deleteRecord(deletingRecord.id);
  };

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
          { heading: "المرفقات", body: record.attachments ?? "—" },
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
          columns: ["المريض", "التشخيص", "الوصفة / العلاج", "الملاحظات", "تاريخ الإضافة"],
          rows: filtered.map((record) => [
            getPatientName(record.patient_id),
            record.diagnosis ?? "-",
            record.prescription ?? "-",
            record.notes ?? "-",
            formatDateTime(record.created_at),
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
  const selectClass = `${inputClass} bg-[#0b1f19]`;
  const textAreaClass = `${inputClass} min-h-[110px] resize-none py-3 leading-7`;
  const submitting = createLoading || updateLoading;

  return (
    <div>
      <PageHeader
        eyebrow="Doctor / Records"
        title="السجلات الطبية"
        description="إدارة السجلات الطبية والتشخيصات للمرضى."
      />

      <GlassCard
        title={`سجلاتي الطبية (${filtered.length})`}
        subtitle="السجلات الطبية المرتبطة بك"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              disabled={loading || !doctor}
              className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" />
              سجل جديد
            </button>
            <button
              type="button"
              onClick={exportAll}
              disabled={exporting || filtered.length === 0}
              className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "جاري التصدير..." : "تصدير PDF"}
            </button>
          </div>
        }
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(260px,1fr)_260px]">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="بحث عن مريض أو تشخيص أو علاج..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} pr-10`}
            />
          </div>

          <select
            value={patientFilter}
            onChange={(event) => setPatientFilter(event.target.value)}
            className={selectClass}
          >
            <option value="">كل المرضى</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{`${patient.first_name} ${patient.last_name}`}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-foreground/10 bg-black/10">
          {loading ? (
            <SkeletonTable rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant={search || patientFilter ? "search" : "data"}
              title="لا توجد سجلات طبية"
              description={
                search || patientFilter
                  ? "لا توجد نتائج مطابقة للبحث أو الفلتر الحالي"
                  : "اضغط على سجل جديد لإضافة أول سجل طبي"
              }
            />
          ) : (
            <DataTable
              columns={["المريض", "التشخيص", "الوصفة / العلاج", "الملاحظات", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((record) => [
                <span key={`${record.id}-patient`} className="font-semibold text-foreground">
                  {getPatientName(record.patient_id)}
                </span>,
                <span
                  key={`${record.id}-diagnosis`}
                  className="line-clamp-2 max-w-[240px] text-foreground/90"
                  title={record.diagnosis || "-"}
                >
                  {record.diagnosis || "-"}
                </span>,
                <span
                  key={`${record.id}-prescription`}
                  className="line-clamp-2 max-w-[240px] text-foreground/75"
                  title={record.prescription || "-"}
                >
                  {record.prescription || "-"}
                </span>,
                <span
                  key={`${record.id}-notes`}
                  className="line-clamp-2 max-w-[220px] text-foreground/60"
                  title={record.notes || "-"}
                >
                  {record.notes || "-"}
                </span>,
                <span key={`${record.id}-date`} className="whitespace-nowrap text-foreground/80">
                  {formatDateTime(record.created_at)}
                </span>,
                <div key={`${record.id}-actions`} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printRecord(record)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 transition hover:bg-emerald-400/20"
                    title="طباعة PDF"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(record)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(record)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10 text-rose-400 transition hover:bg-rose-400/20"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>,
              ])}
            />
          )}
        </div>
      </GlassCard>

      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-foreground/10 bg-background/95 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-foreground/10 pb-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-primary/80">
                  {editingRecord ? "Edit Record" : "New Record"}
                </p>
                <h3 className="text-xl font-black text-foreground">
                  {editingRecord ? "تعديل السجل الطبي" : "إضافة سجل طبي جديد"}
                </h3>
                <p className="mt-1 text-sm text-foreground/55">
                  {editingRecord ? "عدّل بيانات التشخيص والعلاج ثم احفظ التغييرات." : "اكتب بيانات السجل الطبي كاملة واحفظها مباشرة."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRecordModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground/80">المريض</span>
                  <select
                    value={form.patient_id}
                    onChange={(event) => setForm((current) => ({ ...current, patient_id: event.target.value }))}
                    className={selectClass}
                    required
                    disabled={Boolean(editingRecord)}
                  >
                    <option value="">اختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{`${patient.first_name} ${patient.last_name}`}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground/80">التشخيص</span>
                  <input
                    placeholder="اكتب التشخيص"
                    value={form.diagnosis}
                    onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground/80">الوصفة / العلاج</span>
                  <textarea
                    placeholder="اكتب العلاج أو الوصفة الطبية"
                    value={form.prescription}
                    onChange={(event) => setForm((current) => ({ ...current, prescription: event.target.value }))}
                    className={textAreaClass}
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground/80">الملاحظات الطبية</span>
                  <textarea
                    placeholder="اكتب أي ملاحظات إضافية"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className={textAreaClass}
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground/80">رابط المرفقات</span>
                  <input
                    placeholder="رابط المرفقات اختياري"
                    value={form.attachments}
                    onChange={(event) => setForm((current) => ({ ...current, attachments: event.target.value }))}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mt-2 flex flex-col-reverse gap-3 border-t border-foreground/10 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeRecordModal}
                  className="h-12 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
                >
                  إلغاء
                </button>
                <button
                  disabled={submitting || !doctor}
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      جاري الحفظ...
                    </>
                  ) : editingRecord ? (
                    <>
                      <Save className="h-4 w-4" />
                      حفظ التغييرات
                    </>
                  ) : (
                    <>
                      <Stethoscope className="h-4 w-4" />
                      إضافة سجل طبي
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
