import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useDepartments } from "@/hooks/useData";
import { useDeleteMutation, useInsertMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDateTime } from "@/lib/helpers";
import type { Department } from "@/lib/types";

type DepartmentForm = {
  name: string;
  description: string;
};

const initialForm: DepartmentForm = {
  name: "",
  description: "",
};

export default function AdminDepartments() {
  const { data: departments = [], loading, refetch } = useDepartments();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(initialForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  useEscapeClose(modalOpen, () => closeModal());

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return departments;

    return departments.filter((department) => {
      const searchableText = [department.name, department.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [departments, normalizedSearch]);

  const departmentsWithDescription = useMemo(
    () => departments.filter((department) => Boolean(department.description?.trim())).length,
    [departments],
  );

  const latestDepartment = useMemo(() => {
    return [...departments].sort((a, b) => {
      const firstDate = new Date(a.created_at ?? 0).getTime();
      const secondDate = new Date(b.created_at ?? 0).getTime();
      return secondDate - firstDate;
    })[0];
  }, [departments]);

  const { insertItem: createDept, loading: createLoading } = useInsertMutation<Department>("departments", {
    onSuccess: () => {
      refetch();
      closeModal();
    },
    successMessage: "تم إضافة القسم بنجاح",
  });

  const { updateItem: updateDept, loading: updateLoading } = useUpdateMutation<Department>("departments", {
    onSuccess: () => {
      refetch();
      closeModal();
    },
    successMessage: "تم تحديث القسم بنجاح",
  });

  const { deleteItem: deleteDept, loading: deleteLoading } = useDeleteMutation<Department>("departments", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingDept(null);
    },
    successMessage: "تم حذف القسم بنجاح",
  });

  const saving = createLoading || updateLoading;
  const isEditing = Boolean(editingDept);

  function openCreateModal() {
    setEditingDept(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEditModal(department: Department) {
    setEditingDept(department);
    setForm({
      name: department.name || "",
      description: department.description || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingDept(null);
    setForm(initialForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    if (!payload.name) return;

    if (editingDept) {
      await updateDept(editingDept.id, payload);
      return;
    }

    await createDept(payload as Partial<Department>);
  }

  function handleDeleteClick(department: Department) {
    setDeletingDept(department);
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingDept) return;
    deleteDept(deletingDept.id);
  }

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-primary/60 focus:bg-foreground/[0.07]";

  const statCards = [
    {
      label: "إجمالي الأقسام",
      value: departments.length,
      hint: "قسم مسجل داخل النظام",
    },
    {
      label: "بها وصف",
      value: departmentsWithDescription,
      hint: "قسم موضح بتفاصيل",
    },
    {
      label: "نتائج البحث",
      value: filtered.length,
      hint: normalizedSearch ? "مطابقة للبحث الحالي" : "كل الأقسام المعروضة",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin / Departments" title="إدارة الأقسام" description="إدارة الأقسام الطبية والتخصصات في النظام." />

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <GlassCard key={stat.label} className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground/50">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-foreground/45">{stat.hint}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard
        title={`الأقسام (${filtered.length})`}
        subtitle={latestDepartment ? `آخر قسم تمت إضافته: ${latestDepartment.name}` : "الأقسام والتخصصات المتاحة"}
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 transition hover:scale-[1.01] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            قسم جديد
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="بحث باسم القسم أو الوصف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pr-10`}
            />
          </div>

          {normalizedSearch && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="w-fit rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-semibold text-foreground/70 transition hover:bg-foreground/10"
            >
              مسح البحث
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonTable rows={6} columns={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={normalizedSearch ? "search" : "data"}
            action={
              normalizedSearch ? undefined : (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول قسم
                </button>
              )
            }
          />
        ) : (
          <DataTable
            columns={["اسم القسم", "الوصف", "تاريخ الإضافة", "الإجراءات"]}
            rows={filtered.map((department) => [
              <div key={`${department.id}-name`} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{department.name}</p>
                  <p className="text-xs text-foreground/45">Department</p>
                </div>
              </div>,
              <span key={`${department.id}-desc`} className="line-clamp-2 text-foreground/70">
                {department.description || "لا يوجد وصف"}
              </span>,
              formatDateTime(department.created_at),
              <div key={department.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(department)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                  title="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(department)}
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
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-foreground/10 bg-background/95 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-foreground/10 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary/80">
                  {isEditing ? "Edit Department" : "New Department"}
                </p>
                <h3 className="mt-2 text-xl font-black text-foreground">
                  {isEditing ? "تعديل بيانات القسم" : "إضافة قسم جديد"}
                </h3>
                <p className="mt-1 text-sm text-foreground/50">
                  {isEditing ? "عدّل الاسم أو الوصف ثم احفظ التغييرات." : "اكتب بيانات القسم وسيظهر مباشرة داخل الجدول."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/60 transition hover:bg-foreground/10 disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 p-6">
              <label className="grid gap-2">
                <span className="text-xs font-bold text-foreground/60">اسم القسم</span>
                <input
                  placeholder="مثال: الطوارئ"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold text-foreground/60">الوصف</span>
                <textarea
                  placeholder="وصف مختصر للقسم أو التخصص..."
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  className={`${inputClass} min-h-[110px] resize-none py-3 leading-6`}
                />
              </label>

              <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-12 flex-1 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-bold text-foreground transition hover:bg-foreground/10 disabled:opacity-60"
                >
                  إلغاء
                </button>
                <button
                  disabled={saving || !form.name.trim()}
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-black text-white shadow-lg shadow-emerald-500/15 transition hover:scale-[1.01] disabled:scale-100 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {isEditing ? "حفظ التغييرات" : "إضافة القسم"}
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
        title="تأكيد حذف القسم"
        description={`هل أنت متأكد من حذف القسم "${deletingDept?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
