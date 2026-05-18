import { useMemo, useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDateTime } from "@/lib/helpers";
import { createUserAsAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";
import { adminCreateStaffSchema, fullNameSchema, roleSchema, safeValidate } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/sanitize";
import { z } from "zod";
import { toast } from "sonner";
import type { AppRole, AppUser } from "@/lib/types";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  UserCog,
  ShieldCheck,
  Users as UsersIcon,
  X,
  Mail,
  Lock,
  UserPlus,
} from "lucide-react";

type StaffRole = Extract<AppRole, "admin" | "receptionist">;
type ModalMode = "create" | "edit";

const STAFF_ROLES: StaffRole[] = ["admin", "receptionist"];

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "مدير",
  receptionist: "موظف استقبال",
};

const initialForm: {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
} = {
  fullName: "",
  email: "",
  password: "",
  role: "receptionist",
};

export default function AdminStaff() {
  const {
    data: users,
    loading,
    refetch,
  } = useSupabaseQuery<AppUser>("users", { orderBy: "created_at" });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingStaff, setEditingStaff] = useState<AppUser | null>(null);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<AppUser | null>(null);

  useEscapeClose(modalOpen, () => closeModal());

  const staff = useMemo(
    () => users.filter((u) => u.role === "admin" || u.role === "receptionist"),
    [users]
  );

  const stats = useMemo(() => {
    const admins = staff.filter((u) => u.role === "admin").length;
    const receptionists = staff.filter((u) => u.role === "receptionist").length;

    return {
      total: staff.length,
      admins,
      receptionists,
    };
  }, [staff]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return staff;

    return staff.filter((u) =>
      `${u.name ?? ""} ${u.email ?? ""} ${ROLE_LABEL[u.role as StaffRole] ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [search, staff]);

  const { deleteItem: deleteStaff, loading: deleteLoading } =
    useDeleteMutation<AppUser>("users", {
      onSuccess: () => {
        refetch();
        setDeleteDialogOpen(false);
        setDeletingStaff(null);
      },
      successMessage: "تم حذف الموظف من النظام",
    });

  const { updateItem: updateStaff, loading: updateLoading } =
    useUpdateMutation<AppUser>("users", {
      onSuccess: () => {
        refetch();
        closeModal();
      },
      successMessage: "تم تحديث بيانات الموظف بنجاح",
    });

  const closeModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
    setForm(initialForm);
    setModalMode("create");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingStaff(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const handleEditClick = (user: AppUser) => {
    setModalMode("edit");
    setEditingStaff(user);
    setForm({
      fullName: user.name ?? "",
      email: user.email ?? "",
      password: "",
      role: user.role as StaffRole,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.role !== "admin" && form.role !== "receptionist") {
      toast.error("الدور غير صالح");
      return;
    }

    if (modalMode === "create") {
      const validation = safeValidate(adminCreateStaffSchema, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: "",
      });
      if (!validation.data) {
        toast.error("بيانات غير صالحة", { description: validation.error ?? undefined });
        return;
      }
      const clean = validation.data;
      await handleCreate(clean.fullName, clean.email, clean.password);
      return;
    }

    if (!editingStaff) return;

    const editValidation = safeValidate(
      z.object({ name: fullNameSchema, role: roleSchema }),
      { name: form.fullName, role: form.role },
    );
    if (!editValidation.data) {
      toast.error("بيانات غير صالحة", { description: editValidation.error ?? undefined });
      return;
    }

    await updateStaff(editingStaff.id, {
      name: editValidation.data.name,
      role: editValidation.data.role,
    });
  };

  const handleCreate = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    setCreating(true);

    try {
      const { uid, error } = await createUserAsAdmin({
        email,
        password,
        name: fullName,
        role: form.role,
      });

      if (error || !uid) {
        toast.error("فشل إنشاء الحساب", { description: friendlyErrorMessage(error) });
        return;
      }

      const { error: upsertErr } = await supabase.from("users").upsert(
        {
          id: uid,
          name: fullName,
          email,
          role: form.role,
        },
        { onConflict: "id" }
      );

      if (upsertErr) {
        toast.error("تم إنشاء الحساب لكن فشل حفظ البيانات", {
          description: friendlyErrorMessage(upsertErr.message),
        });
      } else {
        toast.success(`تم إنشاء حساب ${ROLE_LABEL[form.role]} بنجاح`);
      }

      refetch();
      closeModal();
    } catch (err) {
      toast.error("حدث خطأ", {
        description: friendlyErrorMessage(err),
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (user: AppUser) => {
    setDeletingStaff(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingStaff) return;
    deleteStaff(deletingStaff.id);
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-primary/50 focus:bg-foreground/[0.07]";

  const selectClass = inputClass + " bg-[#0b1f19]";

  const statCards = [
    {
      label: "إجمالي الموظفين",
      value: stats.total,
      icon: UserCog,
      className: "from-emerald-400/15 to-green-500/5 text-emerald-300",
    },
    {
      label: "المديرون",
      value: stats.admins,
      icon: ShieldCheck,
      className: "from-violet-400/15 to-purple-500/5 text-violet-300",
    },
    {
      label: "موظفو الاستقبال",
      value: stats.receptionists,
      icon: UsersIcon,
      className: "from-sky-400/15 to-cyan-500/5 text-sky-300",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Staff"
        title="إدارة الموظفين"
        description="إنشاء حسابات المديرين وموظفي الاستقبال وإدارتها من شاشة واحدة."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`rounded-[24px] border border-foreground/10 bg-gradient-to-br ${item.className} p-5 shadow-2xl shadow-black/10`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-foreground/55">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {item.value}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/25">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <GlassCard
        title={`الموظفون (${filtered.length})`}
        subtitle="الجدول الكامل للمديرين وموظفي الاستقبال"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 text-sm font-bold text-background shadow-lg shadow-emerald-500/10 transition hover:scale-[1.01] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              موظف جديد
            </button>

            <div className="hidden items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary sm:flex">
              <UserCog className="h-3.5 w-3.5" />
              admin / receptionist
            </div>
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="بحث بالاسم، البريد الإلكتروني، أو الدور..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass + " pr-10"}
            />
          </div>

          {search && (
            <button
              onClick={() => setSearch("")}
              className="h-10 rounded-2xl border border-foreground/10 px-4 text-xs font-semibold text-foreground/60 transition hover:bg-foreground/5"
            >
              مسح البحث
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonTable rows={6} columns={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search ? "search" : "data"}
            action={
              search ? undefined : (
                <button
                  onClick={openCreateModal}
                  className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-background"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول موظف
                </button>
              )
            }
          />
        ) : (
          <DataTable
            columns={[
              "الاسم",
              "البريد الإلكتروني",
              "الدور",
              "تاريخ الإضافة",
              "الإجراءات",
            ]}
            rows={filtered.map((u) => [
              <div key={`name-${u.id}`} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-black text-primary">
                  {(u.name || u.email || "؟").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground">{u.name || "-"}</p>
                  <p className="text-[11px] text-foreground/45">ID: {u.id}</p>
                </div>
              </div>,
              <span
                key={`email-${u.id}`}
                className="inline-flex items-center gap-2 text-sm text-foreground/75"
              >
                <Mail className="h-3.5 w-3.5 text-foreground/35" />
                {u.email || "-"}
              </span>,
              <span
                key={`role-${u.id}`}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                  (u.role === "admin"
                    ? "bg-violet-400/10 text-violet-300"
                    : "bg-sky-400/10 text-sky-300")
                }
              >
                {u.role === "admin" ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <UsersIcon className="h-3 w-3" />
                )}
                {ROLE_LABEL[u.role as StaffRole]}
              </span>,
              formatDateTime(u.created_at),
              <div key={`actions-${u.id}`} className="flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(u)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 transition hover:bg-amber-400/20"
                  title="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteClick(u)}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[28px] border border-foreground/10 bg-[#0b1f19] shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-foreground/10 p-6">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {modalMode === "create" ? (
                    <UserPlus className="h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                  {modalMode === "create" ? "حساب جديد" : "تعديل بيانات"}
                </div>

                <h3 className="text-xl font-black text-foreground">
                  {modalMode === "create"
                    ? "إضافة موظف جديد"
                    : "تعديل بيانات الموظف"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-foreground/55">
                  {modalMode === "create"
                    ? "سيتم إنشاء حساب Auth ثم حفظ بيانات الموظف داخل جدول users."
                    : editingStaff?.email ?? "تحديث الاسم والدور داخل النظام."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold text-foreground/60">
                    الاسم بالكامل
                  </label>
                  <input
                    placeholder="مثال: أحمد محمد"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-foreground/60">
                    البريد الإلكتروني
                  </label>
                  <input
                    placeholder="name@email.com"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required={modalMode === "create"}
                    disabled={modalMode === "edit"}
                    className={inputClass + " disabled:cursor-not-allowed disabled:opacity-55"}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-foreground/60">
                    الدور
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as StaffRole })
                    }
                    required
                    className={selectClass}
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </div>

                {modalMode === "create" && (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold text-foreground/60">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                      <input
                        placeholder="6 أحرف على الأقل"
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        required
                        minLength={6}
                        className={inputClass + " pr-10"}
                      />
                    </div>
                  </div>
                )}
              </div>

              {modalMode === "create" && (
                <p className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-5 text-amber-200/80">
                  ملاحظة: حذف الموظف من هنا يزيل صلاحياته من جدول users فقط. حذف
                  حساب المصادقة نهائياً يتم من Supabase Dashboard →
                  Authentication → Users.
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 rounded-2xl border border-foreground/10 px-5 text-sm font-semibold text-foreground/70 transition hover:bg-foreground/5"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={creating || updateLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-5 text-sm font-bold text-background transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating || updateLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      جاري الحفظ...
                    </>
                  ) : modalMode === "create" ? (
                    <>
                      <Plus className="h-4 w-4" />
                      إضافة موظف
                    </>
                  ) : (
                    "حفظ التغييرات"
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
        onConfirm={handleDeleteConfirm}
        title="حذف الموظف"
        description={`هل أنت متأكد من حذف "${
          deletingStaff?.name ?? deletingStaff?.email ?? ""
        }"؟ سيفقد صلاحياته من النظام فوراً.`}
        confirmText="حذف"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
