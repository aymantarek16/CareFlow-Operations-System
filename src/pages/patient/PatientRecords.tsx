import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
export default function PatientRecords() {
  return (<div><PageHeader eyebrow="Patient / Records" title="ملفي الطبي" description="سجلك الطبي التفصيلي." />
    <GlassCard title="السجل الطبي"><p className="text-sm text-foreground/65 leading-8">ستظهر الزيارات والتشخيصات عند تفعيل وحدة السجلات الطبية.</p></GlassCard></div>);
}
