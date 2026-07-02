import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, UserPlus, X } from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePatients } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDateTime, splitName } from "@/lib/helpers";
import { createUserAsAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";
import { adminCreatePatientSchema, safeValidate } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/sanitize";
import type { PatientProfile } from "@/lib/types";

const initialCreateForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  gender: "male",
  dateOfBirth: "",
};

const initialEditForm = {
  first_name: "",
  last_name: "",
  phone: "",
  gender: "male",
  date_of_birth: "",
};

export default function AdminPatients() {
  const { data: patients = [], loading, refetch } = usePatients();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialCreateForm);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<PatientProfile | null>(null);

  useEscapeClose(createModalOpen, () => setCreateModalOpen(false));
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  const { deleteItem: deletePatient, loading: deleteLoading } = useDeleteMutation<PatientProfile>("patients", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingPatient(null);
    },
    successMessage: "تم حذف المريض بنجاح",
  });

  const { updateItem: updatePatient, loading: updateLoading } = useUpdateMutation<PatientProfile>("patients", {
    onSuccess: () => {
      refetch();
      setEditModalOpen(false);
      setEditingPatient(null);
    },
    successMessage: "تم تحديث بيانات المريض بنجاح",
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return patients;

    return patients.filter((patient) => {
      const searchable = [
        patient.first_name,
        patient.last_name,
        patient.phone,
        patient.gender,
        patient.date_of_birth,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [patients, normalizedSearch]);

  const maleCount = useMemo(() => patients.filter((patient) => patient.gender === "male").length, [patients]);
  const femaleCount = useMemo(() => patients.filter((patient) => patient.gender === "female").length, [patients]);

  const resetCreateForm = () => setForm(initialCreateForm);

  const closeCreateModal = () => {
    if (creating) return;
    setCreateModalOpen(false);
    resetCreateForm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = safeValidate(adminCreatePatientSchema, form);
    if (!validation.data) {
      toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
      return;
    }
    const clean = validation.data;

    setCreating(true);

    try {
      const { uid, error, profileSynced } = await createUserAsAdmin({
        email: clean.email,
        password: clean.password,
        name: clean.fullName,
        role: "patient",
      });

      if (error || !uid) {
        toast.error("فشل إنشاء الحساب", { description: friendlyErrorMessage(error) });
        return;
      }

      const names = splitName(clean.fullName);

      if (!profileSynced) {

      const { error: userError } = await supabase
        .from("users")
        .upsert(
          { id: uid, name: clean.fullName, email: clean.email, role: "patient" },
          { onConflict: "id" },
        );

      if (userError) {
        toast.error("فشل حفظ بيانات المستخدم", { description: friendlyErrorMessage(userError.message) });
        return;
      }

      }

      const { error: patientError } = await supabase.from("patients").insert({
        user_id: uid,
        first_name: names.firstName,
        last_name: names.lastName,
        phone: clean.phone,
        gender: clean.gender,
        date_of_birth: clean.dateOfBirth,
      });

      if (patientError) {
        toast.error("فشل حفظ ملف المريض", { description: friendlyErrorMessage(patientError.message) });
        return;
      }

      toast.success("تم إنشاء حساب المريض بنجاح");
      resetCreateForm();
      setCreateModalOpen(false);
      refetch();
    } catch (err) {
      toast.error("حدث خطأ", { description: friendlyErrorMessage(err) });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (patient: PatientProfile) => {
    setEditingPatient(patient);
    setEditForm({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      phone: patient.phone || "",
      gender: patient.gender || "male",
      date_of_birth: patient.date_of_birth || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    if (!editForm.first_name.trim() || !editForm.phone.trim()) {
      toast.error("الاسم الأول ورقم الهاتف مطلوبين");
      return;
    }

    await updatePatient(editingPatient.id, {
      ...editForm,
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      phone: editForm.phone.trim(),
    });
  };

  const handleDeleteClick = (patient: PatientProfile) => {
    setDeletingPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPatient) return;
    deletePatient(deletingPatient.id);
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:border-primary/50 focus:bg-foreground/[0.07]";

  const modalInputClass = `${inputClass} bg-background/60`;

  return (
    <div>
      <PageHeader
        eyebrow="Admin / Patients"
        title="إدارة ملفات المرضى"
        description="قائمة المرضى مع إمكانية البحث وإنشاء حسابات جديدة."
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[26px] border border-foreground/10 bg-foreground/[0.04] p-4 shadow-lg shadow-black/10 backdrop-blur-xl">
          <p className="text-xs text-foreground/50">إجمالي المرضى</p>
          <p className="mt-2 text-2xl font-black text-foreground">{patients.length}</p>
        </div>
        <div className="rounded-[26px] border border-foreground/10 bg-foreground/[0.04] p-4 shadow-lg shadow-black/10 backdrop-blur-xl">
          <p className="text-xs text-foreground/50">ذكور</p>
          <p className="mt-2 text-2xl font-black text-primary">{maleCount}</p>
        </div>
        <div className="rounded-[26px] border border-foreground/10 bg-foreground/[0.04] p-4 shadow-lg shadow-black/10 backdrop-blur-xl">
          <p className="text-xs text-foreground/50">إناث</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{femaleCount}</p>
        </div>
      </div>

      <GlassCard
        title={`المرضى (${filtered.length})`}
        subtitle="بيانات المرضى المسجلين"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1 sm:min-w-[320px]">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                placeholder="بحث عن مريض..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pr-10`}
              />
            </div>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              إضافة مريض
            </button>
          </div>
        }
      >
        {loading ? (
          <SkeletonTable rows={6} columns={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search ? "search" : "data"}
            action={
              search ? undefined : (
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول مريض
                </button>
              )
            }
          />
        ) : (
          <DataTable
            columns={["الاسم", "الهاتف", "النوع", "تاريخ الميلاد", "تاريخ الإضافة", "الإجراءات"]}
            rows={filtered.map((patient) => [
              <div key={`${patient.id}-name`} className="min-w-[160px]">
                <p className="font-bold text-foreground">
                  {`${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "-"}
                </p>
                <p className="mt-1 text-xs text-foreground/45">ملف مريض</p>
              </div>,
              patient.phone ?? "-",
              <span
                key={`${patient.id}-gender`}
                className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-semibold text-foreground/80"
              >
                {patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "-"}
              </span>,
              patient.date_of_birth ?? "-",
              formatDateTime(patient.created_at),
              <div key={patient.id} className="flex items-center gap-2">
                <Link
                  to={`/admin/patients/${patient.id}`}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                >
                  عرض
                </Link>
                <button
                  type="button"
                  onClick={() => handleEditClick(patient)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                  title="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(patient)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400 transition hover:bg-rose-400/20"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>,
            ])}
          />
        )}
      </GlassCard>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-foreground/10 bg-background/95 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-foreground/10 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">New patient</p>
                <h3 className="mt-2 text-xl font-black text-foreground">إضافة مريض جديد</h3>
                <p className="mt-1 text-sm text-foreground/60">سيتم إنشاء حساب للمريض وحفظ ملفه الطبي تلقائياً.</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="grid gap-4 p-6 md:grid-cols-2">
              <input
                placeholder="الاسم بالكامل"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className={`${modalInputClass} md:col-span-2`}
              />
              <input
                placeholder="البريد الإلكتروني"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={modalInputClass}
              />
              <input
                placeholder="كلمة المرور"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className={modalInputClass}
              />
              <input
                placeholder="الهاتف"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className={modalInputClass}
              />
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={`${modalInputClass} bg-background/80`}
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                required
                className={`${modalInputClass} md:col-span-2`}
              />

              <div className="mt-2 flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="h-12 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  disabled={creating}
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      إضافة مريض
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-foreground/10 bg-background/95 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-foreground/10 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Edit patient</p>
                <h3 className="mt-2 text-xl font-black text-foreground">تعديل بيانات المريض</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  {`${editingPatient.first_name ?? ""} ${editingPatient.last_name ?? ""}`.trim() || "مريض"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={updateLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid gap-4 p-6 md:grid-cols-2">
              <input
                placeholder="الاسم الأول"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                required
                className={modalInputClass}
              />
              <input
                placeholder="الاسم الأخير"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className={modalInputClass}
              />
              <input
                placeholder="الهاتف"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
                className={modalInputClass}
              />
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className={`${modalInputClass} bg-background/80`}
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <input
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                className={`${modalInputClass} md:col-span-2`}
              />

              <div className="mt-2 flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={updateLoading}
                  className="h-12 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  disabled={updateLoading}
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-background shadow-lg shadow-amber-500/20 transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {updateLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/20 border-t-background" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      حفظ التغييرات
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
        title="تأكيد حذف المريض"
        description={`هل أنت متأكد من حذف المريض "${deletingPatient?.first_name ?? ""} ${deletingPatient?.last_name ?? ""}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
