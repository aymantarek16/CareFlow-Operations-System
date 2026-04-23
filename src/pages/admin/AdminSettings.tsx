import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonTable";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemSettings } from "@/hooks/useData";
import { useUpdateMutation, useInsertMutation } from "@/hooks/useMutation";
import type { SystemSettings } from "@/lib/types";
import { Save, RefreshCw, Info, Check, AlertCircle } from "lucide-react";

const DEFAULT_SETTINGS = [
  { key: "clinic_name", label: "اسم العيادة", value: "عيادة CareFlow" },
  { key: "clinic_address", label: "العنوان", value: "" },
  { key: "clinic_phone", label: "رقم الهاتف", value: "" },
  { key: "clinic_email", label: "البريد الإلكتروني", value: "" },
  { key: "appointment_duration", label: "مدة الموعد (دقيقة)", value: "30" },
  { key: "working_hours_start", label: "بداية الدوام", value: "09:00" },
  { key: "working_hours_end", label: "نهاية الدوام", value: "17:00" },
];

export default function AdminSettings() {
  const { appUser } = useAuth();
  const { data: settings, loading, refetch } = useSystemSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { updateItem: updateSetting, loading: updateLoading } = useUpdateMutation<SystemSettings>("system_settings", {
    onSuccess: () => {
      refetch();
      setHasChanges(false);
    },
  });

  const { insertItem: createSetting, loading: createLoading } = useInsertMutation<SystemSettings>("system_settings", {
    onSuccess: () => {
      refetch();
      setHasChanges(false);
    },
  });

  // Initialize form with data from DB or defaults
  useEffect(() => {
    if (!loading) {
      const dbSettings = Object.fromEntries(settings.map((s) => [s.key, s.value]));
      const merged = Object.fromEntries(
        DEFAULT_SETTINGS.map((s) => [s.key, dbSettings[s.key] ?? s.value])
      );
      setFormData(merged);
    }
  }, [settings, loading]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const dbKeys = settings.map((s) => s.key);
    
    for (const [key, value] of Object.entries(formData)) {
      if (dbKeys.includes(key)) {
        // Update existing
        const setting = settings.find((s) => s.key === key);
        if (setting && setting.value !== value) {
          await updateSetting(setting.id, { value });
        }
      } else {
        // Create new
        await createSetting({ key, value });
      }
    }
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader 
        eyebrow="Admin / Settings" 
        title="إعدادات النظام" 
        description="تكوين النظام وتفضيلات الإدارة."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Settings - Editable */}
        <GlassCard 
          title="إعدادات العيادة" 
          subtitle="تخصيص إعدادات النظام"
          className="md:col-span-2"
          action={
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading || updateLoading || createLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {updateLoading || createLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ الإعدادات
            </button>
          }
        >
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-foreground/10" />
                  <div className="h-12 w-full animate-pulse rounded-2xl bg-foreground/5" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {hasChanges && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-300">
                  <AlertCircle className="h-4 w-4" />
                  <span>لديك تغييرات غير محفوظة</span>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_SETTINGS.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="text-sm text-foreground/60">{setting.label}</label>
                    <input
                      type={setting.key.includes("time") ? "time" : "text"}
                      value={formData[setting.key] || ""}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className={inputClass}
                      placeholder={setting.label}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        {/* System Info - Read Only */}
        <GlassCard title="معلومات النظام" subtitle="بيانات المنصة" className={loading ? "opacity-50" : ""}>
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">اسم النظام</p>
              <p className="mt-1 font-semibold text-foreground">CareFlow Medical Operations</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">الإصدار</p>
              <p className="mt-1 font-semibold text-foreground">2.0.0</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">البيئة</p>
              <p className="mt-1 font-semibold text-foreground">Production</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">آخر تحديث</p>
              <p className="mt-1 font-semibold text-foreground">2025-08-18</p>
            </div>
          </div>
        </GlassCard>

        {/* Admin Account */}
        <GlassCard title="حساب المدير" subtitle="بيانات الحساب الحالي">
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">الاسم</p>
              <p className="mt-1 font-semibold text-foreground">{appUser?.name ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">البريد</p>
              <p className="mt-1 font-semibold text-foreground">{appUser?.email ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <p className="text-foreground/50">الدور</p>
              <p className="mt-1 font-semibold text-foreground">{appUser?.role ?? "-"}</p>
            </div>
          </div>
        </GlassCard>

        {/* System Modules */}
        <GlassCard title="الوحدات المتاحة" subtitle="قائمة الوحدات النشطة في النظام" className="md:col-span-2">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { name: "إدارة المرضى", status: "نشط", icon: Check },
              { name: "إدارة الأطباء", status: "نشط", icon: Check },
              { name: "الأقسام والتخصصات", status: "نشط", icon: Check },
              { name: "المواعيد", status: "نشط", icon: Check },
              { name: "الفواتير", status: "نشط", icon: Check },
              { name: "السجلات الطبية", status: "نشط", icon: Check },
              { name: "الوصفات الطبية", status: "قريباً", icon: Info },
              { name: "المختبر", status: "قريباً", icon: Info },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div key={mod.name} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">{mod.name}</p>
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${mod.status === "نشط" ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border border-foreground/10 bg-foreground/5 text-foreground/50"}`}>
                    <Icon className="h-3 w-3" />
                    {mod.status}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
