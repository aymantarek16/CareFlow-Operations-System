import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { usePatients } from "@/hooks/useData";
import { useState } from "react";
export default function ReceptionistPatients() {
  const { data: patients, loading } = usePatients();
  const [search, setSearch] = useState("");
  const filtered = patients.filter((p) => `${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase()));
  return (<div><PageHeader eyebrow="Receptionist / Patients" title="إدارة المرضى" />
    <input placeholder="بحث..." value={search} onChange={(e)=>setSearch(e.target.value)} className="h-12 w-full max-w-md rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none mb-4" />
    <GlassCard title={`المرضى (${filtered.length})`}>
      {loading ? <p className="text-foreground/50 py-8 text-center">جاري التحميل...</p> :
      <DataTable columns={["الاسم","الهاتف","النوع","تاريخ الميلاد"]}
        rows={filtered.map((p)=>[`${p.first_name??""} ${p.last_name??""}`.trim()||"-", p.phone??"-", p.gender??"-", p.date_of_birth??"-"])} />}
    </GlassCard></div>);
}
