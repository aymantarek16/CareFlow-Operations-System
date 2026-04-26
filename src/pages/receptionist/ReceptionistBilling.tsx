import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { DataTable } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useInvoices, usePatients, useDoctors } from "@/hooks/useData";
import { useUpdateMutation } from "@/hooks/useMutation";
import { formatDate } from "@/lib/helpers";
import {
  formatMoney,
  invoiceRemaining,
  isWithinDateRange,
  num,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABEL,
  formatInvoiceStatus,
} from "@/lib/billing";
import { generatePdfReport } from "@/lib/pdf";
import {
  CreditCard,
  FileText,
  Download,
  Printer,
  Eye,
  Banknote,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { AddPaymentDialog } from "@/components/invoices/AddPaymentDialog";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import { useAllPayments } from "@/hooks/useBilling";
import type { InvoiceRecord, PaymentMethod } from "@/lib/types";

type FilterState = {
  search: string;
  status: string;
  method: string;
  doctorId: string;
  from: string;
  to: string;
};

const initialFilter: FilterState = {
  search: "",
  status: "",
  method: "",
  doctorId: "",
  from: "",
  to: "",
};

export default function ReceptionistBilling() {
  const { data: invoices, loading, refetch } = useInvoices();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const { data: payments, refetch: refetchPayments } = useAllPayments();
  const { updateItem: updateInvoice, loading: updating } = useUpdateMutation<InvoiceRecord>(
    "invoices",
    {
      successMessage: "تم تحديث الفاتورة",
      onSuccess: () => {
        refetch();
        refetchPayments();
      },
    },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRecord | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<InvoiceRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<FilterState>(initialFilter);

  const patientName = (id: string) => {
    const p = patients.find((x) => x.id === id);
    return p
      ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(بدون اسم)"
      : "-";
  };

  const doctorName = (id: string | null) => {
    if (!id) return "-";
    const d = doctors.find((x) => x.id === id);
    return d
      ? `د. ${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()
      : "-";
  };

  const paymentMethodsByInvoice = useMemo(() => {
    const map = new Map<string, Set<PaymentMethod>>();
    for (const p of payments) {
      const set = map.get(p.invoice_id) ?? new Set();
      set.add(p.method as PaymentMethod);
      map.set(p.invoice_id, set);
    }
    return map;
  }, [payments]);

  const filtered = useMemo(() => {
    const search = filter.search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filter.status && inv.status !== filter.status) return false;
      if (filter.doctorId && inv.doctor_id !== filter.doctorId) return false;
      if (!isWithinDateRange(inv.issue_date, filter.from, filter.to))
        return false;
      if (filter.method) {
        const m = paymentMethodsByInvoice.get(inv.id);
        if (!m || !m.has(filter.method as PaymentMethod)) return false;
      }
      if (search) {
        const idMatch = inv.id.toLowerCase().includes(search);
        const nameMatch = patientName(inv.patient_id)
          .toLowerCase()
          .includes(search);
        if (!idMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [invoices, filter, paymentMethodsByInvoice]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAmount = filtered.reduce(
    (s, i) => s + num(i.total_amount || i.amount),
    0,
  );
  const paidAmount = filtered.reduce((s, i) => s + num(i.paid_amount), 0);
  const pendingAmount = filtered.reduce((s, i) => s + invoiceRemaining(i), 0);

  const handleMarkPaid = async (inv: InvoiceRecord) => {
    const remaining = invoiceRemaining(inv);
    if (remaining > 0) {
      toast.error("الفاتورة غير مكتملة الدفع", {
        description: `سجّل الدفعة المتبقية (${formatMoney(remaining)}) أولاً.`,
      });
      return;
    }
    await updateInvoice(inv.id, { status: "paid" });
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    await updateInvoice(confirmCancel.id, { status: "cancelled" });
    setConfirmCancel(null);
  };

  const exportAllInvoices = async () => {
    setExporting(true);
    try {
      await generatePdfReport({
        title: "تقرير الفواتير",
        subtitle: `إجمالي ${filtered.length} فاتورة`,
        filename: `invoices-report-${new Date().toISOString().slice(0, 10)}`,
        meta: [
          { label: "عدد الفواتير", value: filtered.length },
          { label: "الإجمالي", value: formatMoney(totalAmount) },
          { label: "المدفوع", value: formatMoney(paidAmount) },
          { label: "المتبقي", value: formatMoney(pendingAmount) },
        ],
        table: {
          columns: [
            "رقم",
            "المريض",
            "الطبيب",
            "الإجمالي",
            "المدفوع",
            "المتبقي",
            "الحالة",
            "التاريخ",
          ],
          rows: filtered.map((inv) => [
            inv.id.slice(0, 8),
            patientName(inv.patient_id),
            doctorName(inv.doctor_id),
            formatMoney(inv.total_amount || inv.amount),
            formatMoney(inv.paid_amount),
            formatMoney(invoiceRemaining(inv)),
            formatInvoiceStatus(inv.status),
            formatDate(inv.issue_date),
          ]),
        },
      });
      toast.success("تم تحميل التقرير");
    } catch {
      toast.error("تعذّر إنشاء ملف PDF");
    } finally {
      setExporting(false);
    }
  };

  const printSingleInvoice = async (inv: InvoiceRecord) => {
    try {
      await generatePdfReport({
        title: "فاتورة طبية",
        subtitle: `رقم الفاتورة: ${inv.id.slice(0, 8)}`,
        filename: `invoice-${inv.id.slice(0, 8)}`,
        meta: [
          { label: "اسم المريض", value: patientName(inv.patient_id) },
          { label: "الطبيب", value: doctorName(inv.doctor_id) },
          { label: "تاريخ الإصدار", value: formatDate(inv.issue_date) },
          { label: "الحالة", value: formatInvoiceStatus(inv.status) },
          { label: "الإجمالي", value: formatMoney(inv.total_amount || inv.amount) },
          { label: "المدفوع", value: formatMoney(inv.paid_amount) },
          { label: "المتبقي", value: formatMoney(invoiceRemaining(inv)) },
        ],
        sections: inv.notes
          ? [{ heading: "ملاحظات", body: inv.notes }]
          : undefined,
        footer: "شكراً لاختياركم خدماتنا",
      });
      toast.success("تم تحميل الفاتورة");
    } catch {
      toast.error("تعذّر إنشاء الفاتورة");
    }
  };

  const inputClass =
    "h-10 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none focus:border-primary/50";
  const selectClass = inputClass + " bg-[#0b1f19]";

  return (
    <div>
      <PageHeader
        eyebrow="Receptionist / Billing"
        title="الفواتير"
        description="إدارة الفواتير والمدفوعات"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">عدد الفواتير</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">الإجمالي</p>
          <p className="text-2xl font-bold text-foreground">
            {formatMoney(totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المدفوع</p>
          <p className="text-2xl font-bold text-emerald-400">
            {formatMoney(paidAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المتبقي</p>
          <p className="text-2xl font-bold text-amber-400">
            {formatMoney(pendingAmount)}
          </p>
        </div>
      </div>

      <GlassCard
        title={`الفواتير (${filtered.length})`}
        subtitle="جميع الفواتير المسجلة"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAllInvoices}
              disabled={exporting || filtered.length === 0}
              className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "جاري التصدير..." : "تصدير PDF"}
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              <CreditCard className="h-3.5 w-3.5" />
              فاتورة جديدة
            </button>
          </div>
        }
      >
        <div className="mb-4 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="relative md:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) =>
                setFilter({ ...filter, search: e.target.value })
              }
              placeholder="بحث برقم الفاتورة أو اسم المريض"
              className={inputClass + " pr-10"}
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className={selectClass}
          >
            <option value="">كل الحالات</option>
            {INVOICE_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filter.method}
            onChange={(e) => setFilter({ ...filter, method: e.target.value })}
            className={selectClass}
          >
            <option value="">كل طرق الدفع</option>
            {PAYMENT_METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filter.from}
            onChange={(e) => setFilter({ ...filter, from: e.target.value })}
            className={inputClass}
            title="من تاريخ"
          />
          <input
            type="date"
            value={filter.to}
            onChange={(e) => setFilter({ ...filter, to: e.target.value })}
            className={inputClass}
            title="إلى تاريخ"
          />
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="data"
            title={
              invoices.length === 0
                ? "لا توجد فواتير"
                : "لا نتائج تطابق الفلاتر"
            }
            description={
              invoices.length === 0
                ? "لم يتم إصدار أي فواتير بعد"
                : "جرّب تعديل البحث أو الفلاتر"
            }
            action={
              invoices.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  <FileText className="h-4 w-4" />
                  إنشاء فاتورة
                </button>
              ) : undefined
            }
          />
        ) : (
          <DataTable
            columns={[
              "رقم",
              "المريض",
              "الإجمالي",
              "المدفوع",
              "المتبقي",
              "الحالة",
              "التاريخ",
              "إجراءات",
            ]}
            rows={filtered.map((inv) => {
              const remaining = invoiceRemaining(inv);
              const isClosed =
                inv.status === "cancelled" || inv.status === "refunded";
              const methods = paymentMethodsByInvoice.get(inv.id);
              return [
                inv.id.slice(0, 8),
                patientName(inv.patient_id),
                formatMoney(inv.total_amount || inv.amount),
                formatMoney(inv.paid_amount),
                <span
                  key={`r-${inv.id}`}
                  className={
                    remaining > 0
                      ? "font-semibold text-amber-300"
                      : "text-foreground/50"
                  }
                >
                  {formatMoney(remaining)}
                </span>,
                <div key={`s-${inv.id}`} className="flex flex-col gap-1">
                  <StatusBadge status={inv.status} />
                  {methods && methods.size > 0 && (
                    <span className="text-[10px] text-foreground/50">
                      {Array.from(methods)
                        .map((m) => PAYMENT_METHOD_LABEL[m])
                        .join("، ")}
                    </span>
                  )}
                </div>,
                formatDate(inv.issue_date),
                <div key={`a-${inv.id}`} className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewId(inv.id)}
                    title="عرض"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  {!isClosed && remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentTarget(inv)}
                      title="تسجيل دفعة"
                      className="flex h-8 items-center gap-1 rounded-lg bg-emerald-400/10 px-2 text-xs text-emerald-300 hover:bg-emerald-400/20"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      دفعة
                    </button>
                  )}
                  {!isClosed && remaining === 0 && inv.status !== "paid" && (
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(inv)}
                      title="تعليم كمدفوعة"
                      disabled={updating}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(inv)}
                      title="إلغاء الفاتورة"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => printSingleInvoice(inv)}
                    title="طباعة"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>,
              ];
            })}
          />
        )}
      </GlassCard>

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          refetch();
          refetchPayments();
        }}
      />
      <AddPaymentDialog
        open={!!paymentTarget}
        invoice={paymentTarget}
        onOpenChange={(o) => !o && setPaymentTarget(null)}
        onPaid={() => {
          refetch();
          refetchPayments();
        }}
      />
      <ViewInvoiceDialog
        open={!!viewId}
        invoiceId={viewId}
        patientName={
          viewId
            ? patientName(invoices.find((i) => i.id === viewId)?.patient_id ?? "")
            : undefined
        }
        doctorName={
          viewId
            ? doctorName(
                invoices.find((i) => i.id === viewId)?.doctor_id ?? null,
              )
            : undefined
        }
        onOpenChange={(o) => !o && setViewId(null)}
      />
      <ConfirmDialog
        open={!!confirmCancel}
        onOpenChange={(o) => !o && setConfirmCancel(null)}
        title="إلغاء الفاتورة"
        description={`هل أنت متأكد من إلغاء الفاتورة #${confirmCancel?.id.slice(0, 8) ?? ""}؟ لا يمكن التراجع.`}
        confirmText="إلغاء الفاتورة"
        cancelText="تراجع"
        variant="danger"
        loading={updating}
        onConfirm={handleCancel}
      />
    </div>
  );
}
