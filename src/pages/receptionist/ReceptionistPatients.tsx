import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePatients } from "@/hooks/useData";
import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { CreatePatientDialog } from "@/components/patients/CreatePatientDialog";

export default function ReceptionistPatients() {
  const { data: patients, loading, refetch } = usePatients();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase()),
  );

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader eyebrow="Receptionist / Patients" title="إدارة المرضى" description="عرض والبحث في سجلات المرضى" />
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
      <GlassCard
        title={`المرضى (${filtered.length})`}
        subtitle="قائمة جميع المرضى المسجلين"
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <UserPlus className="h-3.5 w-3.5" />
            إضافة مريض
          </button>
        }
      >
        {loading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search ? "search" : "data"}
            title="لا يوجد مرضى"
            description={search ? "لا توجد نتائج مطابقة للبحث" : "لم يتم تسجيل أي مرضى بعد"}
            action={
              search ? undefined : (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-background"
                >
                  <UserPlus className="h-4 w-4" />
                  إضافة أول مريض
                </button>
              )
            }
          />
        ) : (
          <DataTable
            columns={["الاسم", "الهاتف", "النوع", "تاريخ الميلاد"]}
            rows={filtered.map((p) => [
              `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "-",
              p.phone ?? "-",
              p.gender === "male" ? "ذكر" : p.gender === "female" ? "أنثى" : p.gender ?? "-",
              p.date_of_birth ?? "-",
            ])}
          />
        )}
      </GlassCard>

      <CreatePatientDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
}
