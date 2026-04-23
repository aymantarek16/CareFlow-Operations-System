import { useState } from "react";
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
import type { Prescription } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, Pill, Syringe } from "lucide-react";

export default function DoctorPrescriptions() {
  const { appUser } = useAuth();
  const { data: doctors, loading: doctorsLoading } = useDoctors();
  const { data: patients, loading: patientsLoading } = usePatients();
  const { data: prescriptions, loading: prescriptionsLoading, refetch } = usePrescriptions();
  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("");

  // Get current doctor
  const doctor = doctors.find((d) => d.user_id === appUser?.id);

  // Filter prescriptions for this doctor only
  const myPrescriptions = doctor ? prescriptions.filter((p) => p.doctor_id === doctor.id) : [];

  const filtered = myPrescriptions.filter((p) => {
    const patient = patients.find((pt) => pt.id === p.patient_id);
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "";
    const matchesSearch = patientName.toLowerCase().includes(search.toLowerCase()) ||
                         p.medication?.toLowerCase().includes(search.toLowerCase());
    const matchesPatient = patientFilter ? p.patient_id === patientFilter : true;
    return matchesSearch && matchesPatient;
  });

  // Form state for creating new prescription
  const [form, setForm] = useState({
    patient_id: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [editForm, setEditForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrescription, setDeletingPrescription] = useState<Prescription | null>(null);

  const { insertItem: createPrescription, loading: createLoading } = useInsertMutation<Prescription>("prescriptions", {
    onSuccess: () => {
      refetch();
      setForm({
        patient_id: "",
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });
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

  const { updateItem: updatePrescription, loading: updateLoading } = useUpdateMutation<Prescription>("prescriptions", {
    onSuccess: () => {
      refetch();
      setEditModalOpen(false);
      setEditingPrescription(null);
    },
    successMessage: "تم تحديث الوصفة الطبية بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;
    await createPrescription({
      ...form,
      doctor_id: doctor.id,
      patient_id: form.patient_id,
    });
  };

  const handleEditClick = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setEditForm({
      medication: prescription.medication || "",
      dosage: prescription.dosage || "",
      frequency: prescription.frequency || "",
      duration: prescription.duration || "",
      instructions: prescription.instructions || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrescription) return;
    await updatePrescription(editingPrescription.id, editForm);
  };

  const handleDeleteClick = (prescription: Prescription) => {
    setDeletingPrescription(prescription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPrescription) return;
    deletePrescription(deletingPrescription.id);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : patientId;
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";
  const loading = doctorsLoading || patientsLoading || prescriptionsLoading;

  return (
    <div>
      <PageHeader
        eyebrow="Doctor / Prescriptions"
        title="الوصفات الطبية"
        description="إدارة الوصفات الطبية للمرضى."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            placeholder="بحث عن مريض أو دواء..."
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
          title={`وصفاتي الطبية (${filtered.length})`}
          subtitle="الوصفات الطبية المرتبطة بك"
          action={
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <Pill className="h-3.5 w-3.5" />
              وصفة جديدة
            </button>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant={search || patientFilter ? "search" : "data"}
              title="لا توجد وصفات طبية"
              description={search || patientFilter ? "لا توجد نتائج مطابقة للبحث" : "لم تقم بإضافة أي وصفات طبية بعد"}
            />
          ) : (
            <DataTable
              columns={["المريض", "الدواء", "الجرعة", "التكرار", "المدة", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((p) => [
                getPatientName(p.patient_id),
                <span key={p.id + "med"} className="font-semibold text-primary">
                  {p.medication || "-"}
                </span>,
                p.dosage || "-",
                p.frequency || "-",
                p.duration || "-",
                formatDateTime(p.created_at),
                <div key={p.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(p)}
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

        <GlassCard title="إضافة وصفة طبية جديدة" subtitle="كتابة وصفة جديدة">
          {loading ? (
            <SkeletonForm fields={6} />
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
                placeholder="اسم الدواء"
                value={form.medication}
                onChange={(e) => setForm({ ...form, medication: e.target.value })}
                required
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="الجرعة (مثال: 500mg)"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  required
                  className={inputClass}
                />
                <input
                  placeholder="التكرار (مثال: 3 مرات يومياً)"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <input
                placeholder="المدة (مثال: 7 أيام)"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                className={inputClass}
              />
              <textarea
                placeholder="التعليمات الخاصة"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className={inputClass + " min-h-[80px] py-3 resize-none"}
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
                    <Syringe className="h-4 w-4" />
                    إضافة وصفة
                  </>
                )}
              </button>
            </form>
          )}
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-foreground">تعديل الوصفة الطبية</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-3">
              <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-3">
                <p className="text-xs text-foreground/50">المريض</p>
                <p className="font-semibold text-foreground">{getPatientName(editingPrescription.patient_id)}</p>
              </div>
              <input
                placeholder="اسم الدواء"
                value={editForm.medication}
                onChange={(e) => setEditForm({ ...editForm, medication: e.target.value })}
                required
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="الجرعة"
                  value={editForm.dosage}
                  onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                  required
                  className={inputClass}
                />
                <input
                  placeholder="التكرار"
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <input
                placeholder="المدة"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                required
                className={inputClass}
              />
              <textarea
                placeholder="التعليمات الخاصة"
                value={editForm.instructions}
                onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
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
        title="تأكيد حذف الوصفة الطبية"
        description="هل أنت متأكد من حذف هذه الوصفة الطبية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
