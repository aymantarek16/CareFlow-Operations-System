import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { splitName } from "@/lib/helpers";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";

interface CreatePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreatePatientDialog({ open, onOpenChange, onCreated }: CreatePatientDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "male",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({ fullName: "", email: "", password: "", phone: "", gender: "male", dateOfBirth: "" });
    }
  }, [open]);

  useEscapeClose(open, () => onOpenChange(false));

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("أدخل اسم المريض");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.fullName, role: "patient" } },
      });
      if (error) {
        toast.error("فشل إنشاء الحساب", { description: error.message });
        setSubmitting(false);
        return;
      }
      if (!data.user) {
        toast.error("فشل إنشاء الحساب");
        setSubmitting(false);
        return;
      }
      const uid = data.user.id;
      const names = splitName(form.fullName);

      await supabase
        .from("users")
        .upsert(
          { id: uid, name: form.fullName, email: form.email, role: "patient" },
          { onConflict: "id" },
        );

      const { error: patientErr } = await supabase.from("patients").insert({
        user_id: uid,
        first_name: names.firstName,
        last_name: names.lastName,
        phone: form.phone || null,
        gender: form.gender,
        date_of_birth: form.dateOfBirth || null,
      });

      if (patientErr) {
        toast.error("تم إنشاء الحساب لكن فشل حفظ بيانات المريض", { description: patientErr.message });
      } else {
        toast.success("تم إنشاء حساب المريض بنجاح");
      }
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("حدث خطأ", { description: err instanceof Error ? err.message : "خطأ غير معروف" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-foreground/10 bg-[#0b1f19] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <UserPlus className="h-5 w-5 text-primary" />
              إضافة مريض جديد
            </h3>
            <p className="mt-1 text-sm text-foreground/55">ينشئ حساب مريض (Auth + users + patients).</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            placeholder="الاسم بالكامل"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            className={inputClass}
          />
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className={inputClass}
          />
          <input
            placeholder="الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className={selectClass}
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-2xl border border-foreground/10 px-5 text-sm font-semibold text-foreground/70 hover:bg-foreground/5"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  إنشاء المريض
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
