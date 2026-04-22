import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";

export default function DoctorPrescriptions() {
  return (
    <div>
      <PageHeader eyebrow="Doctor / Prescriptions" title="الوصفات الطبية" description="وحدة الوصفات الطبية جاهزة للتفعيل." />
      <GlassCard title="الوصفات" subtitle="قريباً">
        <p className="text-sm leading-8 text-foreground/65">سيتم عرض الوصفات الطبية عند تفعيل هذه الوحدة.</p>
      </GlassCard>
    </div>
  );
}
