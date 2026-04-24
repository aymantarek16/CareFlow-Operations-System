import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePatientOverview, useDoctors } from "@/hooks/useData";
import { formatDateTime } from "@/lib/helpers";
import { formatSpecialtyBilingual } from "@/lib/specialties";
import { generatePdfReport } from "@/lib/pdf";
import type { MedicalRecord } from "@/lib/types";
import { Download, Printer, Search, FileText } from "lucide-react";
import { toast } from "sonner";

export default function PatientRecords() {
  const { patient, myRecords, loading } = usePatientOverview();
  const { data: doctors } = useDoctors();
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const patientName = patient
    ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "—"
    : "—";

  const doctorFor = (doctorId: string) => {
    const d = doctors.find((x) => x.id === doctorId);
    if (!d) return "—";
    const name = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "—";
    return d.specialty ? `${name} · ${formatSpecialtyBilingual(d.specialty)}` : name;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myRecords;
    return myRecords.filter((r) => {
      const doctor = doctors.find((d) => d.id === r.doctor_id);
      const hay = [
        r.diagnosis ?? "",
        r.notes ?? "",
        doctor ? `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}` : "",
        doctor?.specialty ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [myRecords, doctors, search]);

  const printRecord = async (record: MedicalRecord) => {
    try {
      await generatePdfReport({
        title: "سجل طبي",
        subtitle: `رقم السجل: ${record.id.slice(0, 8)}`,
        filename: `medical-record-${record.id.slice(0, 8)}`,
        meta: [
          { label: "المريض", value: patientName },
          { label: "الطبيب المعالج", value: doctorFor(record.doctor_id) },
          { label: "تاريخ الإضافة", value: formatDateTime(record.created_at) },
        ],
        sections: [
          { heading: "التشخيص", body: record.diagnosis ?? "—" },
          { heading: "الوصفة / العلاج", body: record.prescription ?? "—" },
          { heading: "الملاحظات", body: record.notes ?? "—" },
        ],
        footer: "ملف طبي — للاستخدام الخاص بالمريض",
      });
      toast.success("تم تحميل السجل");
    } catch {
      toast.error("تعذّر إنشاء السجل");
    }
  };

  const exportAll = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      await generatePdfReport({
        title: "سجلّي الطبي الكامل",
        subtitle: `المريض: ${patientName}`,
        filename: `my-records-${new Date().toISOString().slice(0, 10)}`,
        meta: [{ label: "عدد السجلات", value: filtered.length }],
        table: {
          columns: ["التاريخ", "الطبيب", "التشخيص", "الملاحظات"],
          rows: filtered.map((r) => [
            formatDateTime(r.created_at),
            doctorFor(r.doctor_id),
            r.diagnosis ?? "-",
            r.notes ?? "-",
          ]),
        },
        footer: "ملف طبي — للاستخدام الشخصي",
      });
      toast.success("تم تحميل التقرير");
    } catch {
      toast.error("تعذّر إنشاء ملف PDF");
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  return (
    <div>
      <PageHeader
        eyebrow="Patient / Records"
        title="ملفي الطبي"
        description="كل زياراتك وتشخيصاتك وسجلاتك الطبية في مكان واحد."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            placeholder="بحث عن تشخيص، طبيب، ملاحظة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass + " pr-10"}
          />
        </div>
      </div>

      <GlassCard
        title={`السجلات الطبية (${filtered.length})`}
        subtitle="مرتبة من الأحدث للأقدم"
        action={
          <button
            type="button"
            onClick={exportAll}
            disabled={exporting || filtered.length === 0}
            className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "جاري التصدير..." : "تصدير كامل PDF"}
          </button>
        }
      >
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search ? "search" : "data"}
            title={search ? "لا توجد نتائج" : "لا توجد سجلات طبية"}
            description={
              search
                ? "جرب مصطلح بحث مختلف."
                : "لم يتم إضافة أي سجل طبي لك بعد. ستظهر هنا تلقائياً بعد كل زيارة."
            }
          />
        ) : (
          <DataTable
            columns={["التاريخ", "الطبيب", "التشخيص", "الملاحظات", "الإجراءات"]}
            rows={filtered.map((r) => [
              formatDateTime(r.created_at),
              doctorFor(r.doctor_id),
              <span
                key={r.id + "diag"}
                className="line-clamp-2 max-w-[220px]"
                title={r.diagnosis ?? "-"}
              >
                {r.diagnosis ?? "-"}
              </span>,
              <span
                key={r.id + "notes"}
                className="line-clamp-2 max-w-[200px] text-foreground/60"
                title={r.notes ?? "-"}
              >
                {r.notes ?? "-"}
              </span>,
              <button
                key={r.id + "print"}
                type="button"
                onClick={() => printRecord(r)}
                className="flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1 text-xs text-foreground/80 hover:bg-foreground/10"
                title="طباعة السجل"
              >
                <Printer className="h-3.5 w-3.5" />
                طباعة
              </button>,
            ])}
          />
        )}
      </GlassCard>

      {!loading && filtered.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 3).map((r) => (
            <GlassCard key={r.id} className="!p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
                  <FileText className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">
                    {r.diagnosis ?? "سجل طبي"}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {formatDateTime(r.created_at)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-6 text-foreground/65 line-clamp-3">
                {r.notes ?? "—"}
              </p>
              <p className="mt-3 text-[11px] text-foreground/45">
                {doctorFor(r.doctor_id)}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
