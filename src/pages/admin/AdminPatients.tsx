import { useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePatients } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDateTime, splitName } from "@/lib/helpers";
import { createUserAsAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { PatientProfile } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, UserPlus } from "lucide-react";

export default function AdminPatients() {
  const { data: patients, loading, refetch } = usePatients();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", gender: "male", dateOfBirth: "" });
  const [creating, setCreating] = useState(false);
  
  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "", gender: "male", date_of_birth: "" });
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<PatientProfile | null>(null);
  
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

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { uid, error } = await createUserAsAdmin({
        email: form.email,
        password: form.password,
        name: form.fullName,
        role: "patient",
      });
      if (error || !uid) {
        toast.error("فشل إنشاء الحساب", { description: error ?? undefined });
        setCreating(false);
        return;
      }
      const names = splitName(form.fullName);
      const { error: uErr } = await supabase
        .from("users")
        .upsert(
          { id: uid, name: form.fullName, email: form.email, role: "patient" },
          { onConflict: "id" },
        );
      if (uErr) {
        toast.error("فشل حفظ بيانات المستخدم", { description: uErr.message });
        setCreating(false);
        return;
      }
      const { error: pErr } = await supabase.from("patients").insert({
        user_id: uid,
        first_name: names.firstName,
        last_name: names.lastName,
        phone: form.phone,
        gender: form.gender,
        date_of_birth: form.dateOfBirth,
      });
      if (pErr) {
        toast.error("فشل حفظ ملف المريض", { description: pErr.message });
        setCreating(false);
        return;
      }
      toast.success("تم إنشاء حساب المريض بنجاح");
      setForm({ fullName: "", email: "", password: "", phone: "", gender: "male", dateOfBirth: "" });
      refetch();
    } catch (err) {
      toast.error("حدث خطأ", { description: err instanceof Error ? err.message : "خطأ غير معروف" });
    }
    setCreating(false);
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
    await updatePatient(editingPatient.id, editForm);
  };

  const handleDeleteClick = (patient: PatientProfile) => {
    setDeletingPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPatient) return;
    deletePatient(deletingPatient.id);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Admin / Patients" title="إدارة ملفات المرضى" description="قائمة المرضى مع إمكانية البحث وإنشاء حسابات جديدة." />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input 
            placeholder="بحث عن مريض..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={inputClass + " pr-10"} 
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <GlassCard 
          title={`المرضى (${filtered.length})`} 
          subtitle="بيانات المرضى المسجلين"
          action={
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <UserPlus className="h-3.5 w-3.5" />
              إضافة مريض
            </button>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : filtered.length === 0 ? (
            <EmptyState 
              variant={search ? "search" : "data"} 
              action={
                search ? undefined : (
                  <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    إضافة أول مريض
                  </button>
                )
              }
            />
          ) : (
            <DataTable
              columns={["الاسم", "الهاتف", "النوع", "تاريخ الميلاد", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((p) => [
                `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "-",
                p.phone ?? "-",
                p.gender === "male" ? "ذكر" : p.gender === "female" ? "أنثى" : "-",
                p.date_of_birth ?? "-",
                formatDateTime(p.created_at),
                <div key={p.id} className="flex items-center gap-2">
                  <Link to={`/admin/patients/${p.id}`} className="text-primary text-xs hover:underline">عرض</Link>
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

        <GlassCard title="إضافة مريض جديد" subtitle="ينشئ الحساب تلقائياً">
          {loading ? (
            <SkeletonForm fields={6} />
          ) : (
            <form onSubmit={handleCreate} className="grid gap-3">
              <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className={inputClass} />
              <input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
              <input placeholder="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
              <input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className={inputClass} />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass + " bg-[#0b1f19]"}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required className={inputClass} />
              <button disabled={creating} type="submit" className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2">
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
            </form>
          )}
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-foreground">تعديل بيانات المريض</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-3">
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
              <input 
                placeholder="الهاتف" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                className={inputClass} 
              />
              <select 
                value={editForm.gender} 
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} 
                className={inputClass + " bg-[#0b1f19]"}
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <input 
                type="date" 
                value={editForm.date_of_birth} 
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} 
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
        title="تأكيد حذف المريض"
        description={`هل أنت متأكد من حذف المريض "${deletingPatient?.first_name} ${deletingPatient?.last_name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
