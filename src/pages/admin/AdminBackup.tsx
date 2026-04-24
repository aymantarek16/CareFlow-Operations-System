import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  BACKUP_TABLES,
  exportCsv,
  exportExcel,
  exportJson,
  fetchFullBackup,
  fetchTable,
  type BackupColumn,
} from "@/lib/backup";
import type {
  AppUser,
  AppointmentRecord,
  DoctorProfile,
  InvoiceRecord,
  MedicalRecord,
  PatientProfile,
  Department,
  SystemSettings,
  Prescription,
} from "@/lib/types";
import {
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type ExportFormat = "csv" | "xlsx" | "json";

type TableDefinition<T> = {
  table: string;
  title: string;
  description: string;
  columns: BackupColumn<T>[];
};

const TABLES: TableDefinition<Record<string, unknown>>[] = [
  {
    table: "patients",
    title: "المرضى",
    description: "بيانات المرضى المسجلين",
    columns: [
      { key: "id", label: "ID" },
      { key: "first_name", label: "الاسم الأول" },
      { key: "last_name", label: "الاسم الأخير" },
      { key: "phone", label: "الهاتف" },
      { key: "gender", label: "النوع" },
      { key: "date_of_birth", label: "تاريخ الميلاد" },
      { key: "created_at", label: "تاريخ الإضافة" },
    ] as BackupColumn<PatientProfile>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "doctors",
    title: "الأطباء",
    description: "بيانات طاقم الأطباء",
    columns: [
      { key: "id", label: "ID" },
      { key: "first_name", label: "الاسم الأول" },
      { key: "last_name", label: "الاسم الأخير" },
      { key: "specialty", label: "التخصص" },
      { key: "phone", label: "الهاتف" },
      { key: "created_at", label: "تاريخ الإضافة" },
    ] as BackupColumn<DoctorProfile>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "users",
    title: "المستخدمون",
    description: "حسابات المستخدمين وأدوارهم",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "الاسم" },
      { key: "email", label: "البريد الإلكتروني" },
      { key: "role", label: "الدور" },
      { key: "created_at", label: "تاريخ الإضافة" },
    ] as BackupColumn<AppUser>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "appointments",
    title: "المواعيد",
    description: "سجل المواعيد المحجوزة",
    columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "المريض" },
      { key: "doctor_id", label: "الطبيب" },
      { key: "appointment_date", label: "التاريخ" },
      { key: "appointment_time", label: "الوقت" },
      { key: "status", label: "الحالة" },
      { key: "reason", label: "السبب" },
      { key: "notes", label: "ملاحظات" },
      { key: "created_at", label: "تاريخ الإنشاء" },
    ] as BackupColumn<AppointmentRecord>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "invoices",
    title: "الفواتير",
    description: "الفواتير والمدفوعات",
    columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "المريض" },
      { key: "amount", label: "المبلغ" },
      { key: "status", label: "الحالة" },
      { key: "issue_date", label: "تاريخ الإصدار" },
      { key: "notes", label: "ملاحظات" },
      { key: "created_at", label: "تاريخ الإنشاء" },
    ] as BackupColumn<InvoiceRecord>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "medical_records",
    title: "السجلات الطبية",
    description: "التشخيصات والملاحظات الطبية",
    columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "المريض" },
      { key: "doctor_id", label: "الطبيب" },
      { key: "title", label: "العنوان" },
      { key: "diagnosis", label: "التشخيص" },
      { key: "prescription", label: "الوصفة" },
      { key: "notes", label: "ملاحظات" },
      { key: "created_at", label: "تاريخ الإنشاء" },
    ] as BackupColumn<MedicalRecord>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "prescriptions",
    title: "الوصفات الطبية",
    description: "الوصفات الدوائية",
    columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "المريض" },
      { key: "doctor_id", label: "الطبيب" },
      { key: "medication", label: "الدواء" },
      { key: "dosage", label: "الجرعة" },
      { key: "frequency", label: "التكرار" },
      { key: "duration", label: "المدة" },
      { key: "status", label: "الحالة" },
      { key: "created_at", label: "تاريخ الإنشاء" },
    ] as BackupColumn<Prescription>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "departments",
    title: "الأقسام",
    description: "أقسام العيادة",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "الاسم" },
      { key: "description", label: "الوصف" },
      { key: "created_at", label: "تاريخ الإضافة" },
    ] as BackupColumn<Department>[] as BackupColumn<Record<string, unknown>>[],
  },
  {
    table: "system_settings",
    title: "إعدادات النظام",
    description: "إعدادات العيادة والنظام",
    columns: [
      { key: "id", label: "ID" },
      { key: "key", label: "المفتاح" },
      { key: "value", label: "القيمة" },
      { key: "updated_at", label: "تاريخ آخر تحديث" },
    ] as BackupColumn<SystemSettings>[] as BackupColumn<Record<string, unknown>>[],
  },
];

export default function AdminBackup() {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const isBusy = (key: string) => busyKey === key;

  const dateStamp = new Date().toISOString().slice(0, 10);

  const exportSingle = async (
    def: TableDefinition<Record<string, unknown>>,
    format: ExportFormat,
  ) => {
    const key = `${def.table}-${format}`;
    setBusyKey(key);
    try {
      const rows = await fetchTable<Record<string, unknown>>(def.table);
      if (rows.length === 0) {
        toast.info(`لا توجد بيانات في ${def.title}`);
        return;
      }
      const filename = `${def.table}-${dateStamp}`;
      if (format === "csv") exportCsv(filename, rows, def.columns);
      else if (format === "xlsx") exportExcel(filename, rows, def.columns, def.title);
      else exportJson(filename, rows);
      toast.success(`تم تصدير ${def.title} (${rows.length} صف)`);
    } catch (err) {
      toast.error(
        `تعذّر التصدير: ${err instanceof Error ? err.message : "خطأ غير معروف"}`,
      );
    } finally {
      setBusyKey(null);
    }
  };

  const exportFullBackup = async () => {
    setBusyKey("full-backup");
    try {
      const payload = await fetchFullBackup();
      const total = Object.values(payload.tables).reduce(
        (sum, rows) => sum + rows.length,
        0,
      );
      exportJson(`careflow-backup-${dateStamp}`, payload);
      toast.success(`تم إنشاء نسخة احتياطية (${total} سجل من ${BACKUP_TABLES.length} جدول)`);
    } catch (err) {
      toast.error(
        `تعذّر إنشاء النسخة الاحتياطية: ${err instanceof Error ? err.message : "خطأ غير معروف"}`,
      );
    } finally {
      setBusyKey(null);
    }
  };

  const btnClass =
    "flex items-center gap-1.5 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50 transition";

  return (
    <div>
      <PageHeader
        eyebrow="Admin / Backup"
        title="النسخ الاحتياطي والتصدير"
        description="تصدير بيانات النظام إلى صيغ مختلفة (CSV / Excel / JSON) — هذه الصفحة متاحة للمدير فقط."
      />

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="space-y-1 leading-6">
          <p className="font-semibold text-amber-100">ملاحظات هامة</p>
          <ul className="list-inside list-disc space-y-0.5 text-amber-200/80">
            <li>ملفات CSV و Excel تدعم اللغة العربية (UTF-8 + اتجاه RTL).</li>
            <li>النسخة الاحتياطية الكاملة هي ملف JSON واحد يحتوي على كل الجداول — احفظه في مكان آمن.</li>
            <li>التصدير يحترم صلاحيات RLS الحالية — سترى فقط البيانات التي يُسمح لدورك برؤيتها.</li>
          </ul>
        </div>
      </div>

      {/* Full backup card */}
      <GlassCard
        title="نسخة احتياطية كاملة"
        subtitle="كل الجداول في ملف JSON واحد — مثالي للأرشفة أو النقل بين الأنظمة"
        className="mb-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-foreground/80">
                يتضمن: {BACKUP_TABLES.join("، ")}
              </p>
              <p className="mt-1 text-xs text-foreground/50">
                الملف الناتج: <code className="rounded bg-foreground/5 px-1">careflow-backup-{dateStamp}.json</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportFullBackup}
            disabled={busyKey !== null}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isBusy("full-backup") ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isBusy("full-backup") ? "جاري التجهيز..." : "إنشاء نسخة احتياطية"}
          </button>
        </div>
      </GlassCard>

      {/* Per-table exports */}
      <GlassCard
        title="تصدير حسب الجدول"
        subtitle="اختر الجدول والصيغة المناسبة"
      >
        <div className="grid gap-3">
          {TABLES.map((def) => (
            <div
              key={def.table}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{def.title}</p>
                <p className="mt-0.5 text-xs text-foreground/55">{def.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyKey !== null}
                  onClick={() => exportSingle(def, "csv")}
                >
                  {isBusy(`${def.table}-csv`) ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  CSV
                </button>
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyKey !== null}
                  onClick={() => exportSingle(def, "xlsx")}
                >
                  {isBusy(`${def.table}-xlsx`) ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  )}
                  Excel
                </button>
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyKey !== null}
                  onClick={() => exportSingle(def, "json")}
                >
                  {isBusy(`${def.table}-json`) ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileJson className="h-3.5 w-3.5" />
                  )}
                  JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
