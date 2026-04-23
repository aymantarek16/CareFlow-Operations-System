import { useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDepartments } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation, useInsertMutation } from "@/hooks/useMutation";
import { formatDateTime } from "@/lib/helpers";
import type { Department } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, Building2 } from "lucide-react";

export default function AdminDepartments() {
  const { data: departments, loading, refetch } = useDepartments();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  
  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  const filtered = departments.filter((d) =>
    `${d.name} ${d.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const { insertItem: createDept, loading: createLoading } = useInsertMutation<Department>("departments", {
    onSuccess: () => {
      refetch();
      setForm({ name: "", description: "" });
    },
    successMessage: "تم إضافة القسم بنجاح",
  });

  const { deleteItem: deleteDept, loading: deleteLoading } = useDeleteMutation<Department>("departments", {
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setDeletingDept(null);
    },
    successMessage: "تم حذف القسم بنجاح",
  });
  
  const { updateItem: updateDept, loading: updateLoading } = useUpdateMutation<Department>("departments", {
    onSuccess: () => {
      refetch();
      setEditModalOpen(false);
      setEditingDept(null);
    },
    successMessage: "تم تحديث القسم بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDept(form);
  };

  const handleEditClick = (dept: Department) => {
    setEditingDept(dept);
    setEditForm({
      name: dept.name || "",
      description: dept.description || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    await updateDept(editingDept.id, editForm);
  };

  const handleDeleteClick = (dept: Department) => {
    setDeletingDept(dept);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDept) return;
    deleteDept(deletingDept.id);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Admin / Departments" title="إدارة الأقسام" description="إدارة الأقسام الطبية والتخصصات في النظام." />
      
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input 
            placeholder="بحث عن قسم..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={inputClass + " pr-10"} 
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <GlassCard 
          title={`الأقسام (${filtered.length})`} 
          subtitle="الأقسام والتخصصات المتاحة"
          action={
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <Building2 className="h-3.5 w-3.5" />
              إضافة قسم
            </button>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={4} />
          ) : filtered.length === 0 ? (
            <EmptyState 
              variant={search ? "search" : "data"} 
              action={
                search ? undefined : (
                  <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    إضافة أول قسم
                  </button>
                )
              }
            />
          ) : (
            <DataTable
              columns={["اسم القسم", "الوصف", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((d) => [
                d.name,
                d.description ?? "-",
                formatDateTime(d.created_at),
                <div key={d.id} className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(d)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(d)}
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
        
        <GlassCard title="إضافة قسم جديد" subtitle="إنشاء قسم أو تخصص جديد">
          {loading ? (
            <SkeletonForm fields={2} />
          ) : (
            <form onSubmit={handleCreate} className="grid gap-3">
              <input 
                placeholder="اسم القسم" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
                className={inputClass} 
              />
              <textarea 
                placeholder="وصف القسم (اختياري)" 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                className={inputClass + " min-h-[80px] py-3 resize-none"} 
              />
              <button 
                disabled={createLoading}
                type="submit" 
                className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    إضافة قسم
                  </>
                )}
              </button>
            </form>
          )}
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-foreground">تعديل القسم</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-3">
              <input 
                placeholder="اسم القسم" 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                required
                className={inputClass} 
              />
              <textarea 
                placeholder="وصف القسم" 
                value={editForm.description} 
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
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
