import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { useDoctorOverview } from "@/hooks/useData";

export default function DoctorPatients() {
  const { myPatients } = useDoctorOverview();
  return (
    <div>
      <PageHeader eyebrow="Doctor / Patients" title="المرضى المرتبطون" />
      <GlassCard title="قائمة المرضى">
        <DataTable columns={["الاسم","الهاتف","النوع","تاريخ الميلاد"]}
          rows={myPatients.map((p) => [`${p.first_name??""} ${p.last_name??""}`.trim()||"-", p.phone??"-", p.gender??"-", p.date_of_birth??"-"])} />
      </GlassCard>
    </div>
  );
}
