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
import { useAllPayments, useAllInvoiceItems } from "@/hooks/useBilling";
import { formatDate } from "@/lib/helpers";
import {
  formatMoney,
  formatInvoiceStatus,
  invoiceRemaining,
  isWithinDateRange,
  num,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABEL,
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

function isToday(d: string | null | undefined): boolean {
  if (!d) return false;
  return d.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function isThisMonth(d: string | null | undefined): boolean {
  if (!d) return false;
  const now = new Date();
  return d.slice(0, 7) === now.toISOString().slice(0, 7);
}

export default function AdminInvoices() {
  const { data: invoices, loading, refetch } = useInvoices();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const { data: payments, refetch: refetchPayments } = useAllPayments();
  const { data: items } = useAllInvoiceItems();
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

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((s, p) => s + num(p.amount), 0);
    const todayRevenue = payments
      .filter((p) => isToday(p.created_at))
      .reduce((s, p) => s + num(p.amount), 0);
    const monthRevenue = payments
      .filter((p) => isThisMonth(p.created_at))
      .reduce((s, p) => s + num(p.amount), 0);
    const pending = invoices.filter((i) => i.status === "pending").length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    const partial = invoices.filter((i) => i.status === "partially_paid").length;
    const cancelled = invoices.filter((i) => i.status === "cancelled").length;
    const outstandingTotal = invoices
      .filter(
        (i) => i.status !== "cancelled" && i.status !== "refunded",
      )
      .reduce((s, i) => s + invoiceRemaining(i), 0);

    const serviceCount = new Map<string, { count: number; revenue: number }>();
    for (const it of items) {
      const key = it.service_name.trim();
      if (!key) continue;
      const cur = serviceCount.get(key) ?? { count: 0, revenue: 0 };
      cur.count += Number(it.quantity ?? 0);
      cur.revenue += num(it.unit_price) * Number(it.quantity ?? 0);
      serviceCount.set(key, cur);
    }
    const topServices = Array.from(serviceCount.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      pending,
      paid,
      partial,
      cancelled,
      outstandingTotal,
      topServices,
    };
  }, [payments, invoices, items]);

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
          { label: "الإيرادات الكلية", value: formatMoney(stats.totalRevenue) },
          { label: "إيرادات اليوم", value: formatMoney(stats.todayRevenue) },
          { label: "إيرادات الشهر", value: formatMoney(stats.monthRevenue) },
          { label: "المتبقي على العملاء", value: formatMoney(stats.outstandingTotal) },
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
        sections:
          stats.topServices.length > 0
            ? [
                {
                  heading: "أعلى الخدمات إيراداً",
                  table: {
                    columns: ["الخدمة", "الكمية", "الإيراد"],
                    rows: stats.topServices.map(([name, agg]) => [
                      name,
                      agg.count,
                      formatMoney(agg.revenue),
                    ]),
                  },
                },
              ]
            : undefined,
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
        sections: inv.notes ? [{ heading: "ملاحظات", body: inv.notes }] : undefined,
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
        eyebrow="Admin / Billing"
        title="الفواتير والحسابات"
        description="إدارة الفواتير والمدفوعات والتقارير المالية."
      />

      {/* Revenue Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">إيرادات اليوم</p>
          <p className="text-2xl font-bold text-emerald-400">
            {formatMoney(stats.todayRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">إيرادات الشهر</p>
          <p className="text-2xl font-bold text-emerald-400">
            {formatMoney(stats.monthRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">الإيرادات الكلية</p>
          <p className="text-2xl font-bold text-foreground">
            {formatMoney(stats.totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">المتبقي على العملاء</p>
          <p className="text-2xl font-bold text-amber-400">
            {formatMoney(stats.outstandingTotal)}
          </p>
        </div>
      </div>

      {/* Status Counts */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">معلقة</p>
          <p className="text-xl font-bold text-amber-300">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">مدفوعة جزئياً</p>
          <p className="text-xl font-bold text-cyan-300">{stats.partial}</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">مدفوعة</p>
          <p className="text-xl font-bold text-emerald-300">{stats.paid}</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/50">ملغية</p>
          <p className="text-xl font-bold text-rose-300">{stats.cancelled}</p>
        </div>
      </div>

      {/* Top services */}
      {stats.topServices.length > 0 && (
        <div className="mb-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">
            أعلى الخدمات إيراداً
          </p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
            {stats.topServices.map(([name, agg]) => (
              <div
                key={name}
                className="rounded-xl border border-foreground/10 bg-foreground/[0.04] p-3"
              >
                <p className="text-xs font-semibold text-foreground/80">
                  {name}
                </p>
                <p className="mt-1 text-[10px] text-foreground/50">
                  الكمية: {agg.count}
                </p>
                <p className="text-sm font-bold text-emerald-300">
                  {formatMoney(agg.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <GlassCard
        title={`الفواتير (${filtered.length})`}
        subtitle="جميع الفواتير في النظام"
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
        <div className="mb-4 grid gap-2 md:grid-cols-3 lg:grid-cols-7">
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
          <select
            value={filter.doctorId}
            onChange={(e) =>
              setFilter({ ...filter, doctorId: e.target.value })
            }
            className={selectClass}
          >
            <option value="">كل الأطباء</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {`د. ${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()}
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
              "الطبيب",
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
                doctorName(inv.doctor_id),
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
