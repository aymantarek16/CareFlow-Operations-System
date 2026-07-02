import { useMemo, useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePrescriptions, usePatients, useDoctors } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation, useInsertMutation } from "@/hooks/useMutation";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/helpers";
import { friendlyErrorMessage } from "@/lib/sanitize";
import { supabase } from "@/lib/supabase";
import type { Prescription } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, Pill, Syringe, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { optionalMultilineSchema, optionalShortTextSchema, safeValidate, shortTextSchema } from "@/lib/validation";

const prescriptionSchema = z.object({
  patient_id: z.string().uuid("مريض غير صالح"),
  medication: shortTextSchema(200),
  dosage: optionalShortTextSchema(120),
  frequency: optionalShortTextSchema(120),
  duration: optionalShortTextSchema(120),
  instructions: optionalMultilineSchema(2000),
});

const editPrescriptionSchema = z.object({
  medication: shortTextSchema(200),
  dosage: optionalShortTextSchema(120),
  frequency: optionalShortTextSchema(120),
  duration: optionalShortTextSchema(120),
  instructions: optionalMultilineSchema(2000),
});

type PrescriptionFormState = {
  patient_id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const initialFormState: PrescriptionFormState = {
  patient_id: "",
  medication: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

export default function DoctorPrescriptions() {
  const { appUser } = useAuth();
  const { data: doctors, loading: doctorsLoading } = useDoctors();
  const { data: patients, loading: patientsLoading } = usePatients();
  const { data: prescriptions, loading: prescriptionsLoading, refetch } = usePrescriptions();

  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [form, setForm] = useState<PrescriptionFormState>(initialFormState);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrescription, setDeletingPrescription] = useState<Prescription | null>(null);
  const [secureDeleteLoading, setSecureDeleteLoading] = useState(false);

  const doctor = useMemo(() => doctors.find((d) => d.user_id === appUser?.id), [doctors, appUser?.id]);

  const patientsById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.id, patient]));
  }, [patients]);

  const getPatientName = (patientId: string) => {
    const patient = patientsById.get(patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : patientId;
  };

  const myPrescriptions = useMemo(() => {
    if (!doctor) return [];
    return prescriptions.filter((prescription) => prescription.doctor_id === doctor.id);
  }, [doctor, prescriptions]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return myPrescriptions.filter((prescription) => {
      const patientName = getPatientName(prescription.patient_id).toLowerCase();
      const medication = prescription.medication?.toLowerCase() ?? "";
      const dosage = prescription.dosage?.toLowerCase() ?? "";
      const frequency = prescription.frequency?.toLowerCase() ?? "";
      const duration = prescription.duration?.toLowerCase() ?? "";
      const instructions = prescription.instructions?.toLowerCase() ?? "";

      const matchesSearch = normalizedSearch
        ? [patientName, medication, dosage, frequency, duration, instructions].some((value) => value.includes(normalizedSearch))
        : true;
      const matchesPatient = patientFilter ? prescription.patient_id === patientFilter : true;

      return matchesSearch && matchesPatient;
    });
  }, [myPrescriptions, search, patientFilter, patientsById]);

  const loading = doctorsLoading || patientsLoading || prescriptionsLoading;
  const isEditing = Boolean(editingPrescription);
  const canSubmit = Boolean(doctor) && Boolean(form.patient_id) && Boolean(form.medication.trim()) && Boolean(form.dosage.trim()) && Boolean(form.frequency.trim()) && Boolean(form.duration.trim());

  const { insertItem: createPrescription, loading: createLoading } = useInsertMutation<Prescription>("prescriptions", {
    onSuccess: () => {
      refetch();
      closeModal();
    },
    successMessage: "تم إضافة الوصفة الطبية بنجاح",
  });

  const { deleteItem: deletePrescription, loading: deleteLoading } = useDeleteMutation<Prescription>("prescriptions", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingPrescription(null);
    },
    successMessage: "تم حذف الوصفة الطبية بنجاح",
  });

  void deletePrescription;
  void deleteLoading;

  const { updateItem: updatePrescription, loading: updateLoading } = useUpdateMutation<Prescription>("prescriptions", {
    onSuccess: () => {
      refetch();
      closeModal();
    },
    successMessage: "تم تحديث الوصفة الطبية بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    const validation = safeValidate(prescriptionSchema, form);
    if (!validation.data) {
      toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
      return;
    }

    await createPrescription({
      ...validation.data,
      doctor_id: doctor.id,
    });
  };
  const mutationLoading = createLoading || updateLoading;

  function openCreateModal() {
    setEditingPrescription(null);
    setForm(initialFormState);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPrescription(null);
    setForm(initialFormState);
  }

  useEscapeClose(modalOpen, closeModal);

  const handleEditClick = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setForm({
      patient_id: prescription.patient_id || "",
      medication: prescription.medication || "",
      dosage: prescription.dosage || "",
      frequency: prescription.frequency || "",
      duration: prescription.duration || "",
      instructions: prescription.instructions || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !canSubmit) return;

    if (editingPrescription) {
      const validation = safeValidate(editPrescriptionSchema, {
        medication: form.medication,
        dosage: form.dosage,
        frequency: form.frequency,
        duration: form.duration,
        instructions: form.instructions,
      });
      if (!validation.data) {
        toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
        return;
      }
      await updatePrescription(editingPrescription.id, validation.data);
      return;
    }

    const validation = safeValidate(prescriptionSchema, form);
    if (!validation.data) {
      toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
      return;
    }
    await createPrescription({
      ...validation.data,
      doctor_id: doctor.id,
    });
  };

  const handleDeleteClick = (prescription: Prescription) => {
    setDeletingPrescription(prescription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPrescription || !doctor) return;

    if (deletingPrescription.doctor_id !== doctor.id) {
      toast.error("\u0644\u0627 \u062a\u0645\u0644\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0648\u0635\u0641\u0629");
      return;
    }

    setSecureDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("prescriptions")
        .delete()
        .eq("id", deletingPrescription.id)
        .eq("doctor_id", doctor.id)
        .select("id")
        .single();

      if (error) {
        toast.error("\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641", { description: friendlyErrorMessage(error.message) });
        return;
      }

      toast.success("\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0648\u0635\u0641\u0629 \u0627\u0644\u0637\u0628\u064a\u0629 \u0628\u0646\u062c\u0627\u062d");
      refetch();
      setDeleteDialogOpen(false);
      setDeletingPrescription(null);
    } catch (err) {
      toast.error("\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641", { description: friendlyErrorMessage(err) });
    } finally {
      setSecureDeleteLoading(false);
    }
  };
  const resetFilters = () => {
    setSearch("");
    setPatientFilter("");
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-primary/60 focus:bg-foreground/[0.07]";
  const selectClass = `${inputClass} bg-[#0b1f19]`;
  const textareaClass = `${inputClass} min-h-[96px] resize-none py-3 leading-6`;

  return (
    <div>
      <PageHeader
        eyebrow="Doctor / Prescriptions"
        title="الوصفات الطبية"
        description="إدارة الوصفات الطبية للمرضى."
      />

      <GlassCard
        title={`وصفاتي الطبية (${filtered.length})`}
        subtitle="الوصفات الطبية المرتبطة بك"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              disabled={loading || !doctor}
              className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              وصفة جديدة
            </button>
            <div className="hidden items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/70 md:flex">
              <Pill className="h-3.5 w-3.5 text-primary" />
              {myPrescriptions.length} وصفة
            </div>
          </div>
        }
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr,260px,auto]">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="بحث عن مريض، دواء، جرعة أو تعليمات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pr-10`}
            />
          </div>

          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">كل المرضى</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{`${patient.first_name} ${patient.last_name}`}</option>
            ))}
          </select>

          {(search || patientFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-12 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm font-semibold text-foreground/75 transition hover:bg-foreground/10"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonTable rows={6} columns={8} />
        ) : !doctor ? (
          <EmptyState
            variant="data"
            title="لا يوجد حساب طبيب مرتبط"
            description="لا يمكن إضافة وصفات قبل ربط حسابك ببيانات الطبيب."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search || patientFilter ? "search" : "data"}
            title="لا توجد وصفات طبية"
            description={search || patientFilter ? "لا توجد نتائج مطابقة للبحث" : "لم تقم بإضافة أي وصفات طبية بعد"}
          />
        ) : (
          <DataTable
            columns={["المريض", "الدواء", "الجرعة", "التكرار", "المدة", "التعليمات", "تاريخ الإضافة", "الإجراءات"]}
            rows={filtered.map((prescription) => [
              <span key={`${prescription.id}-patient`} className="font-semibold text-foreground">
                {getPatientName(prescription.patient_id)}
              </span>,
              <span key={`${prescription.id}-medication`} className="font-semibold text-primary">
                {prescription.medication || "-"}
              </span>,
              prescription.dosage || "-",
              prescription.frequency || "-",
              prescription.duration || "-",
              <span key={`${prescription.id}-instructions`} className="line-clamp-2 max-w-[260px] text-foreground/70">
                {prescription.instructions || "-"}
              </span>,
              formatDateTime(prescription.created_at),
              <div key={`${prescription.id}-actions`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditClick(prescription)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                  title="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(prescription)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10 text-rose-400 transition hover:bg-rose-400/20"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>,
            ])}
          />
        )}
      </GlassCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-foreground/10 bg-background/95 p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <Syringe className="h-3.5 w-3.5" />
                  {isEditing ? "تعديل وصفة" : "وصفة جديدة"}
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {isEditing ? "تعديل الوصفة الطبية" : "إضافة وصفة طبية جديدة"}
                </h3>
                <p className="mt-1 text-sm text-foreground/55">
                  اكتب بيانات الوصفة بدقة، ثم احفظ التغييرات.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <SkeletonForm fields={6} />
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-3">
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm((current) => ({ ...current, patient_id: e.target.value }))}
                  className={selectClass}
                  disabled={isEditing}
                  required
                >
                  <option value="">اختر المريض</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{`${patient.first_name} ${patient.last_name}`}</option>
                  ))}
                </select>

                <input
                  placeholder="اسم الدواء"
                  value={form.medication}
                  onChange={(e) => setForm((current) => ({ ...current, medication: e.target.value }))}
                  required
                  className={inputClass}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    placeholder="الجرعة (مثال: 500mg)"
                    value={form.dosage}
                    onChange={(e) => setForm((current) => ({ ...current, dosage: e.target.value }))}
                    required
                    className={inputClass}
                  />
                  <input
                    placeholder="التكرار (مثال: 3 مرات يومياً)"
                    value={form.frequency}
                    onChange={(e) => setForm((current) => ({ ...current, frequency: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>

                <input
                  placeholder="المدة (مثال: 7 أيام)"
                  value={form.duration}
                  onChange={(e) => setForm((current) => ({ ...current, duration: e.target.value }))}
                  required
                  className={inputClass}
                />

                <textarea
                  placeholder="التعليمات الخاصة"
                  value={form.instructions}
                  onChange={(e) => setForm((current) => ({ ...current, instructions: e.target.value }))}
                  className={textareaClass}
                />

                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-11 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
                  >
                    إلغاء
                  </button>
                  <button
                    disabled={mutationLoading || !canSubmit}
                    type="submit"
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mutationLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Syringe className="h-4 w-4" />
                        {isEditing ? "حفظ التغييرات" : "إضافة وصفة"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="تأكيد حذف الوصفة الطبية"
        description="هل أنت متأكد من حذف هذه الوصفة الطبية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={secureDeleteLoading}
      />
    </div>
  );
}
