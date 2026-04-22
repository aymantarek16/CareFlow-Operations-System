import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";

export default function DoctorRecords() {
  return (
    <div>
      <PageHeader eyebrow="Doctor / Records" title="السجلات الطبية" description="صفحة جاهزة لعرض السجلات الطبية والملاحظات." />
      <GlassCard title="حالة الوحدة" subtitle="جاهزة للتطوير">
        <p className="text-sm leading-8 text-foreground/65">عند إضافة بيانات لجدول <span className="font-semibold text-foreground">medical_records</span> ستظهر هنا مباشرة.</p>
      </GlassCard>
    </div>
  );
}
