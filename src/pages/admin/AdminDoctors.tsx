import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Plus, Search, Stethoscope, Trash2, X, Eye } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useDoctors, useDepartments } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation } from "@/hooks/useMutation";
import { createUserAsAdmin } from "@/lib/adminAuth";
import { formatDateTime, splitName } from "@/lib/helpers";
import { formatSpecialtyBilingual } from "@/lib/specialties";
import { supabase } from "@/lib/supabase";
import { adminCreateDoctorSchema, safeValidate } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/sanitize";
import type { DoctorProfile } from "@/lib/types";

type CreateDoctorForm = {
  fullName: string;
  email: string;
  password: string;
  specialty: string;
  phone: string;
};

type EditDoctorForm = {
  first_name: string;
  last_name: string;
  specialty: string;
  phone: string;
};

const initialCreateForm: CreateDoctorForm = {
  fullName: "",
  email: "",
  password: "",
  specialty: "",
  phone: "",
};

const initialEditForm: EditDoctorForm = {
  first_name: "",
  last_name: "",
  specialty: "",
  phone: "",
};

export default function AdminDoctors() {
  const { data: doctors = [], loading, refetch } = useDoctors();
  const { data: departments = [] } = useDepartments();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CreateDoctorForm>(initialCreateForm);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [editForm, setEditForm] = useState<EditDoctorForm>(initialEditForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDoctor, setDeletingDoctor] = useState<DoctorProfile | null>(null);

  useEscapeClose(createModalOpen, () => closeCreateModal());
  useEscapeClose(editModalOpen, () => closeEditModal());

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return doctors;

    return doctors.filter((doctor) => {
      const searchableText = [
        doctor.first_name,
        doctor.last_name,
        doctor.specialty,
        doctor.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [doctors, normalizedSearch]);

  const doctorsWithPhone = useMemo(
    () => doctors.filter((doctor) => Boolean(doctor.phone?.trim())).length,
    [doctors],
  );

  const uniqueSpecialties = useMemo(
    () => new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean)).size,
    [doctors],
  );

  const { deleteItem: deleteDoctor, loading: deleteLoading } = useDeleteMutation<DoctorProfile>("doctors", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingDoctor(null);
    },
    successMessage: "تم حذف الطبيب بنجاح",
  });

  const { updateItem: updateDoctor, loading: updateLoading } = useUpdateMutation<DoctorProfile>("doctors", {
    onSuccess: () => {
      refetch();
      closeEditModal();
    },
    successMessage: "تم تحديث بيانات الطبيب بنجاح",
  });

  function closeCreateModal() {
    if (creating) return;
    setCreateModalOpen(false);
    setForm(initialCreateForm);
  }

  function closeEditModal() {
    if (updateLoading) return;
    setEditModalOpen(false);
    setEditingDoctor(null);
    setEditForm(initialEditForm);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = safeValidate(adminCreateDoctorSchema, form);
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
        role: "doctor",
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
          { id: uid, name: clean.fullName, email: clean.email, role: "doctor" },
          { onConflict: "id" },
        );

      if (userError) {
        toast.error("فشل حفظ بيانات المستخدم", { description: friendlyErrorMessage(userError.message) });
        return;
      }

      }

      const { error: doctorError } = await supabase.from("doctors").insert({
        user_id: uid,
        first_name: names.firstName,
        last_name: names.lastName,
        specialty: clean.specialty,
        phone: clean.phone,
      });

      if (doctorError) {
        toast.error("فشل حفظ ملف الطبيب", { description: friendlyErrorMessage(doctorError.message) });
        return;
      }

      toast.success("تم إنشاء حساب الطبيب بنجاح");
      setForm(initialCreateForm);
      setCreateModalOpen(false);
      refetch();
    } catch (err) {
      toast.error("حدث خطأ", { description: friendlyErrorMessage(err) });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (doctor: DoctorProfile) => {
    setEditingDoctor(doctor);
    setEditForm({
      first_name: doctor.first_name || "",
      last_name: doctor.last_name || "",
      specialty: doctor.specialty || "",
      phone: doctor.phone || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    await updateDoctor(editingDoctor.id, {
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      specialty: editForm.specialty.trim(),
      phone: editForm.phone.trim(),
    });
  };

  const handleDeleteClick = (doctor: DoctorProfile) => {
    setDeletingDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDoctor) return;
    deleteDoctor(deletingDoctor.id);
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-primary/60 focus:bg-foreground/[0.07]";
  const selectClass = `${inputClass} cursor-pointer bg-[#0b1f19]`;
  const renderSpecialtyField = (
    value: string,
    onChange: (value: string) => void,
    required = false,
  ) => {
    if (departments.length === 0) {
      return (
        <input
          placeholder="التخصص"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClass}
        />
      );
    }

    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className={selectClass}>
        <option value="">اختر التخصص / القسم</option>
        {departments.map((department) => (
          <option key={department.id} value={department.name}>
            {formatSpecialtyBilingual(department.name)}
          </option>
        ))}
        <option value="عام">{formatSpecialtyBilingual("عام")}</option>
      </select>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin / Doctors" title="إدارة الطاقم الطبي" description="إنشاء حسابات أطباء وربطها بالمواعيد والمرضى." />

      <div className="grid gap-3 md:grid-cols-3">
        <GlassCard title="إجمالي الأطباء" subtitle="كل الحسابات الطبية المسجلة">
          <p className="text-3xl font-black text-foreground">{doctors.length}</p>
        </GlassCard>
        <GlassCard title="التخصصات" subtitle="عدد التخصصات المستخدمة">
          <p className="text-3xl font-black text-primary">{uniqueSpecialties}</p>
        </GlassCard>
        <GlassCard title="بيانات مكتملة" subtitle="أطباء لديهم رقم هاتف">
          <p className="text-3xl font-black text-emerald-400">{doctorsWithPhone}</p>
        </GlassCard>
      </div>

      <GlassCard
        title={`الأطباء (${filtered.length})`}
        subtitle="بيانات من جدول doctors"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Plus className="h-3.5 w-3.5" />
              طبيب جديد
            </button>
          </div>
        }
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="بحث بالاسم أو التخصص أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pr-10`}
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="self-start rounded-xl border border-foreground/10 px-3 py-2 text-xs font-semibold text-foreground/70 transition hover:bg-foreground/5 md:self-auto"
            >
              مسح البحث
            </button>
          )}
        </div>

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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.01]"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول طبيب
                </button>
              )
            }
          />
        ) : (
          <DataTable
            columns={["الاسم", "التخصص", "الهاتف", "تاريخ الإضافة", "الإجراءات"]}
            rows={filtered.map((doctor) => [
              `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim() || "-",
              doctor.specialty ? formatSpecialtyBilingual(doctor.specialty) : "-",
              doctor.phone ?? "-",
              formatDateTime(doctor.created_at),
              <div key={doctor.id} className="flex items-center gap-2">
                <Link
                  to={`/admin/doctors/${doctor.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20"
                  title="عرض"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleEditClick(doctor)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                  title="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(doctor)}
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
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-primary/80">New Doctor</p>
                <h3 className="text-xl font-black text-foreground">إضافة طبيب جديد</h3>
                <p className="mt-1 text-sm text-foreground/60">ينشئ Auth + users + doctors من نفس النافذة.</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 disabled:opacity-50"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="الاسم بالكامل"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className={inputClass}
              />
              <input
                placeholder="البريد الإلكتروني"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={inputClass}
              />
              <input
                placeholder="كلمة المرور"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className={inputClass}
              />
              {renderSpecialtyField(form.specialty, (value) => setForm({ ...form, specialty: value }), true)}
              <input
                placeholder="الهاتف"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="md:col-span-2 h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-primary/60 focus:bg-foreground/[0.07]"
              />

              <div className="mt-3 flex gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="h-11 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  disabled={creating}
                  type="submit"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Stethoscope className="h-4 w-4" />
                      إضافة طبيب
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-400/80">Edit Doctor</p>
                <h3 className="text-xl font-black text-foreground">تعديل بيانات الطبيب</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  {`${editingDoctor.first_name ?? ""} ${editingDoctor.last_name ?? ""}`.trim() || "طبيب"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={updateLoading}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 disabled:opacity-50"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="الاسم الأول"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="الاسم الأخير"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className={inputClass}
              />
              {renderSpecialtyField(editForm.specialty, (value) => setEditForm({ ...editForm, specialty: value }))}
              <input
                placeholder="الهاتف"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className={inputClass}
              />

              <div className="mt-3 flex gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updateLoading}
                  className="h-11 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  disabled={updateLoading}
                  type="submit"
                  className="h-11 flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-background transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {updateLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="تأكيد حذف الطبيب"
        description={`هل أنت متأكد من حذف الطبيب "${deletingDoctor?.first_name ?? ""} ${deletingDoctor?.last_name ?? ""}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
