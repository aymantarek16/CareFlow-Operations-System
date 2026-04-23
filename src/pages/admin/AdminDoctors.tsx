import { useState } from "react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable, SkeletonForm } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDoctors, useDepartments } from "@/hooks/useData";
import { useDeleteMutation, useUpdateMutation } from "@/hooks/useMutation";
import { formatDateTime, splitName } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { DoctorProfile } from "@/lib/types";
import { Pencil, Trash2, Plus, Search, Stethoscope } from "lucide-react";

export default function AdminDoctors() {
  const { data: doctors, loading, refetch } = useDoctors();
  const { data: departments } = useDepartments();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", specialty: "", phone: "" });
  const [creating, setCreating] = useState(false);
  
  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", specialty: "", phone: "" });
  useEscapeClose(editModalOpen, () => setEditModalOpen(false));

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDoctor, setDeletingDoctor] = useState<DoctorProfile | null>(null);

  const filtered = doctors.filter((d) =>
    `${d.first_name} ${d.last_name} ${d.specialty}`.toLowerCase().includes(search.toLowerCase())
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
      setEditModalOpen(false);
      setEditingDoctor(null);
    },
    successMessage: "تم تحديث بيانات الطبيب بنجاح",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.fullName, role: "doctor" } },
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
      const names = splitName(form.fullName);
      await supabase.from("users").insert({ id: uid, name: form.fullName, email: form.email, role: "doctor" });
      await supabase.from("doctors").insert({ user_id: uid, first_name: names.firstName, last_name: names.lastName, specialty: form.specialty, phone: form.phone });
      toast.success("تم إنشاء حساب الطبيب بنجاح");
      setForm({ fullName: "", email: "", password: "", specialty: "", phone: "" });
      refetch();
    } catch (err) { 
      toast.error("حدث خطأ", { description: err instanceof Error ? err.message : "خطأ غير معروف" });
    }
    setCreating(false);
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
    await updateDoctor(editingDoctor.id, editForm);
  };

  const handleDeleteClick = (doctor: DoctorProfile) => {
    setDeletingDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDoctor) return;
    deleteDoctor(deletingDoctor.id);
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div>
      <PageHeader eyebrow="Admin / Doctors" title="إدارة الطاقم الطبي" description="إنشاء حسابات أطباء وربطها بالمواعيد والمرضى." />
      
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input 
            placeholder="بحث عن طبيب..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={inputClass + " pr-10"} 
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <GlassCard 
          title={`الأطباء (${filtered.length})`} 
          subtitle="بيانات من جدول doctors"
          action={
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <Stethoscope className="h-3.5 w-3.5" />
              إضافة طبيب
            </button>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState 
              variant={search ? "search" : "data"} 
              action={
                search ? undefined : (
                  <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    إضافة أول طبيب
                  </button>
                )
              }
            />
          ) : (
            <DataTable
              columns={["الاسم", "التخصص", "الهاتف", "تاريخ الإضافة", "الإجراءات"]}
              rows={filtered.map((d) => [
                `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "-",
                d.specialty ?? "-", 
                d.phone ?? "-", 
                formatDateTime(d.created_at),
                <div key={d.id} className="flex items-center gap-2">
                  <Link to={`/admin/doctors/${d.id}`} className="text-primary text-xs hover:underline">عرض</Link>
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
        
        <GlassCard title="إضافة طبيب جديد" subtitle="ينشئ Auth + users + doctors">
          {loading ? (
            <SkeletonForm fields={5} />
          ) : (
            <form onSubmit={handleCreate} className="grid gap-3">
              <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className={inputClass} />
              <input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
              <input placeholder="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
              {departments.length > 0 ? (
                <select 
                  value={form.specialty} 
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })} 
                  required 
                  className={selectClass}
                >
                  <option value="">اختر التخصص / القسم</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                  <option value="عام">عام</option>
                </select>
              ) : (
                <input placeholder="التخصص" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required className={inputClass} />
              )}
              <input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className={inputClass} />
              <button disabled={creating} type="submit" className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2">
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
            </form>
          )}
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-background/95 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-foreground">تعديل بيانات الطبيب</h3>
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
              {departments.length > 0 ? (
                <select 
                  value={editForm.specialty} 
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} 
                  className={selectClass}
                >
                  <option value="">اختر التخصص / القسم</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                  <option value="عام">عام</option>
                </select>
              ) : (
                <input 
                  placeholder="التخصص" 
                  value={editForm.specialty} 
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} 
                  className={inputClass} 
                />
              )}
              <input 
                placeholder="الهاتف" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
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
        title="تأكيد حذف الطبيب"
        description={`هل أنت متأكد من حذف الطبيب "${deletingDoctor?.first_name} ${deletingDoctor?.last_name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
