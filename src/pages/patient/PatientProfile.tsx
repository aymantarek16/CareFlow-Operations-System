import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePatientOverview } from "@/hooks/useData";
export default function PatientProfile() {
  const { patient } = usePatientOverview();
  return (<div><PageHeader eyebrow="Patient / Profile" title="الملف الشخصي" />
    <GlassCard title="البيانات الأساسية">
      <div className="grid gap-4 md:grid-cols-2 text-sm">
        {[["الاسم", `${patient?.first_name??""} ${patient?.last_name??""}`], ["الهاتف", patient?.phone], ["النوع", patient?.gender], ["تاريخ الميلاد", patient?.date_of_birth]].map(([l,v]) => (
          <div key={String(l)} className="rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-4">
            <p className="text-foreground/50">{l}</p><p className="mt-2 font-semibold text-foreground">{String(v??"-")}</p>
          </div>
        ))}
      </div>
    </GlassCard></div>);
}
