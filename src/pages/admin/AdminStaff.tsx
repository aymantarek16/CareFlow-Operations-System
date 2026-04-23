import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDateTime } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { AppUser, AppRole } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, UserCog, ShieldCheck, Users as UsersIcon } from "lucide-react";

type StaffRole = Extract<AppRole, "admin" | "receptionist">;
const STAFF_ROLES: StaffRole[] = ["admin", "receptionist"];

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "مدير",
  receptionist: "موظف استقبال",
};

export default function AdminStaff() {
  const { data: users, loading, refetch } = useSupabaseQuery<AppUser>("users", { orderBy: "created_at" });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{ fullName: string; email: string; password: string; role: StaffRole }>({
    fullName: "",
    email: "",
    password: "",
    role: "receptionist",
  });
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: StaffRole }>({ name: "", role: "receptionist" });

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<AppUser | null>(null);

  const staff = useMemo(
    () => users.filter((u) => u.role === "admin" || u.role === "receptionist"),
    [users]
  );

  const filtered = staff.filter((u) =>
    `${u.name ?? ""} ${u.email ?? ""} ${ROLE_LABEL[u.role as StaffRole] ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const { deleteItem: deleteStaff, loading: deleteLoading } = useDeleteMutation<AppUser>("users", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingStaff(null);
    },
    successMessage: "تم حذف الموظف من النظام",
  });

  const { updateItem: updateStaff, loading: updateLoading } = useUpdateMutation<AppUser>("users", {
    onSuccess: () => {
      refetch();
      setEditModalOpen(false);
      setEditingStaff(null);
    },
    successMessage: "تم تحديث بيانات الموظف بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.fullName, role: form.role } },
      });
      if (error) {
        toast.error("فشل إنشاء الحساب", { description: error.message });
        setCreating(false);
        return;
      }
      if (!data.user) {
        toast.error("فشل إنشاء الحساب");
        setCreating(false);
        return;
      }
      const uid = data.user.id;
      // Ensure the public.users row has the correct role (in case the trigger picked a default)
      const { error: upsertErr } = await supabase
        .from("users")
        .upsert({ id: uid, name: form.fullName, email: form.email, role: form.role }, { onConflict: "id" });
      if (upsertErr) {
        toast.error("تم إنشاء الحساب لكن فشل حفظ البيانات", { description: upsertErr.message });
      } else {
        toast.success(`تم إنشاء حساب ${ROLE_LABEL[form.role]} بنجاح`);
      }
      setForm({ fullName: "", email: "", password: "", role: "receptionist" });
      refetch();
    } catch (err) {
      toast.error("حدث خطأ", { description: err instanceof Error ? err.message : "خطأ غير معروف" });
    }
    setCreating(false);
  };

  const handleEditClick = (user: AppUser) => {
    setEditingStaff(user);
    setEditForm({ name: user.name ?? "", role: user.role as StaffRole });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    await updateStaff(editingStaff.id, { name: editForm.name, role: editForm.role });
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
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div>
      <PageHeader
        eyebrow="Admin / Staff"
        title="إدارة الموظفين"
        description="إنشاء حسابات المديرين وموظفي الاستقبال وإدارتها."
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            placeholder="بحث عن موظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass + " pr-10"}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <GlassCard
          title={`الموظفون (${filtered.length})`}
          subtitle="المديرون وموظفو الاستقبال"
          action={
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              <UserCog className="h-3.5 w-3.5" />
              admin / receptionist
            </div>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant={search ? "search" : "data"}
              action={
                search ? undefined : (
                  <p className="text-xs text-foreground/50">أضف أول موظف من الفورم بجانب الجدول</p>
                )
              }
            />
          ) : (
            <DataTable
              columns={["الاسم", "البريد الإلكتروني", "الدور", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((u) => [
                u.name || "-",
                u.email || "-",
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
                <div key={u.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(u)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(u)}
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

        <GlassCard title="إضافة موظف جديد" subtitle="ينشئ Auth + users">
          {loading ? (
            <SkeletonForm fields={4} />
          ) : (
            <form onSubmit={handleCreate} className="grid gap-3">
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
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                required
                className={selectClass}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                disabled={creating}
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-background disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    إضافة موظف
                  </>
                )}
              </button>
              <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-5 text-amber-200/80">
                ملاحظة: حذف الموظف يزيل صلاحياته من النظام فقط. لحذف حساب المصادقة نهائياً
                اذهب إلى Supabase Dashboard → Authentication → Users.
              </p>
            </form>
          )}
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-foreground/10 bg-[#0b1f19] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground">تعديل بيانات الموظف</h3>
            <p className="mt-1 text-sm text-foreground/55">{editingStaff.email}</p>
            <form onSubmit={handleEditSubmit} className="mt-5 grid gap-3">
              <input
                placeholder="الاسم"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                className={inputClass}
              />
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffRole })}
                required
                className={selectClass}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="h-11 rounded-2xl border border-foreground/10 px-5 text-sm font-semibold text-foreground/70 hover:bg-foreground/5"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-5 text-sm font-bold text-background disabled:opacity-60"
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
        onConfirm={handleDeleteConfirm}
        title="حذف الموظف"
        description={`هل أنت متأكد من حذف "${deletingStaff?.name ?? deletingStaff?.email ?? ""}"؟ سيفقد صلاحياته من النظام فوراً.`}
        confirmText="حذف"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
