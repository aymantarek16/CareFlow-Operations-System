/**
 * PDF report generator.
 *
 * Uses html2pdf.js so we get full Arabic / RTL / unicode support out of the
 * box — the browser renders the HTML and html2pdf rasterises it via html2canvas
 * into a jsPDF document. No font loading required.
 */

import { supabase } from "@/lib/supabase";

export type ClinicHeader = {
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  logoDataUrl?: string;
};

export type PdfTable = {
  columns: string[];
  rows: (string | number)[][];
  caption?: string;
};

export type PdfReport = {
  title: string;
  subtitle?: string;
  filename: string;
  meta?: Array<{ label: string; value: string | number }>;
  sections?: Array<{ heading: string; body?: string; table?: PdfTable }>;
  table?: PdfTable;
  footer?: string;
};

type Html2PdfWorker = {
  from: (element: HTMLElement) => {
    set: (options: Record<string, unknown>) => {
      save: () => Promise<void>;
    };
  };
};

type Html2PdfFactory = () => Html2PdfWorker;

/** In-memory cache so we don't re-query settings for every PDF in the same page load. */
let cachedHeader: ClinicHeader | null = null;
let html2pdfFactory: Html2PdfFactory | null = null;

async function getHtml2Pdf(): Promise<Html2PdfFactory> {
  if (!html2pdfFactory) {
    const module = (await import("html2pdf.js")) as { default: Html2PdfFactory };
    html2pdfFactory = module.default;
  }

  return html2pdfFactory;
}

export async function loadClinicHeader(): Promise<ClinicHeader> {
  if (cachedHeader) return cachedHeader;

  const { data } = await supabase.from("system_settings").select("key,value");
  const map = new Map<string, string>(
    (data ?? []).map((row: { key: string; value: string }) => [row.key, row.value]),
  );

  cachedHeader = {
    clinicName: map.get("clinic_name") || "CareFlow",
    clinicAddress: map.get("clinic_address") || "",
    clinicPhone: map.get("clinic_phone") || "",
    clinicEmail: map.get("clinic_email") || "",
    logoDataUrl: map.get("clinic_logo") || "",
  };
  return cachedHeader;
}

/** Force a refresh of the cached clinic header (e.g. after settings are saved). */
export function clearClinicHeaderCache() {
  cachedHeader = null;
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTable(table: PdfTable): string {
  const thead = table.columns
    .map((c) => `<th>${escapeHtml(c)}</th>`)
    .join("");
  const tbody = table.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `
    ${table.caption ? `<div class="table-caption">${escapeHtml(table.caption)}</div>` : ""}
    <table class="report-table">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody || `<tr><td colspan="${table.columns.length}" class="empty">لا توجد بيانات</td></tr>`}</tbody>
    </table>
  `;
}

function buildHtml(report: PdfReport, header: ClinicHeader): string {
  const metaHtml = report.meta?.length
    ? `<div class="meta-grid">${report.meta
        .map(
          (m) =>
            `<div class="meta-item"><span class="meta-label">${escapeHtml(
              m.label,
            )}</span><span class="meta-value">${escapeHtml(m.value)}</span></div>`,
        )
        .join("")}</div>`
    : "";

  const sectionsHtml = (report.sections ?? [])
    .map(
      (s) => `
        <section class="report-section">
          <h3>${escapeHtml(s.heading)}</h3>
          ${s.body ? `<p class="section-body">${escapeHtml(s.body)}</p>` : ""}
          ${s.table ? renderTable(s.table) : ""}
        </section>
      `,
    )
    .join("");

  const mainTable = report.table ? renderTable(report.table) : "";
  const generatedAt = new Date().toLocaleString("ar-EG");

  return `
    <div class="pdf-root" dir="rtl" lang="ar">
      <style>
        .pdf-root {
          font-family: "Cairo", "Tahoma", "Arial", sans-serif;
          color: #0a0f0d;
          direction: rtl;
          padding: 24px;
          background: #ffffff;
          font-size: 12px;
          line-height: 1.6;
        }
        .pdf-root * { box-sizing: border-box; }
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #059669;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .pdf-header .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pdf-header .brand img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          border-radius: 8px;
        }
        .pdf-header .clinic-name {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
        }
        .pdf-header .clinic-contact {
          font-size: 10px;
          color: #4b5563;
          line-height: 1.4;
        }
        .pdf-header .generated {
          font-size: 10px;
          color: #6b7280;
          text-align: left;
        }
        .report-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }
        .report-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 12px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
          margin: 12px 0 16px;
          padding: 10px 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .meta-item {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .meta-label { color: #6b7280; font-size: 11px; }
        .meta-value { color: #111827; font-weight: 600; font-size: 12px; }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0 16px;
          font-size: 11px;
        }
        .report-table th {
          background: #059669;
          color: #ffffff;
          text-align: right;
          padding: 8px 10px;
          font-weight: 600;
        }
        .report-table td {
          padding: 7px 10px;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
          text-align: right;
        }
        .report-table tbody tr:nth-child(even) td { background: #f9fafb; }
        .report-table .empty { text-align: center; color: #9ca3af; font-style: italic; padding: 20px; }
        .table-caption {
          font-size: 12px;
          font-weight: 600;
          color: #111827;
          margin: 6px 0;
        }
        .report-section { margin: 14px 0; }
        .report-section h3 {
          font-size: 13px;
          margin: 0 0 6px;
          color: #059669;
          border-right: 3px solid #059669;
          padding-right: 8px;
        }
        .section-body { margin: 0 0 6px; color: #1f2937; white-space: pre-wrap; }
        .pdf-footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          font-size: 10px;
          color: #6b7280;
          display: flex;
          justify-content: space-between;
        }
      </style>

      <div class="pdf-header">
        <div class="brand">
          ${header.logoDataUrl ? `<img src="${header.logoDataUrl}" alt="logo" />` : ""}
          <div>
            <div class="clinic-name">${escapeHtml(header.clinicName)}</div>
            <div class="clinic-contact">
              ${escapeHtml(header.clinicAddress ?? "")}
              ${header.clinicPhone ? ` • ${escapeHtml(header.clinicPhone)}` : ""}
              ${header.clinicEmail ? ` • ${escapeHtml(header.clinicEmail)}` : ""}
            </div>
          </div>
        </div>
        <div class="generated">
          <div>تم الإنشاء:</div>
          <div>${escapeHtml(generatedAt)}</div>
        </div>
      </div>

      <h1 class="report-title">${escapeHtml(report.title)}</h1>
      ${report.subtitle ? `<p class="report-subtitle">${escapeHtml(report.subtitle)}</p>` : ""}

      ${metaHtml}
      ${sectionsHtml}
      ${mainTable}

      <div class="pdf-footer">
        <span>${escapeHtml(report.footer ?? "")}</span>
        <span>${escapeHtml(header.clinicName)}</span>
      </div>
    </div>
  `;
}

/**
 * Render the given report to a PDF file and trigger a download.
 */
export async function generatePdfReport(report: PdfReport): Promise<void> {
  const header = await loadClinicHeader();
  const html2pdf = await getHtml2Pdf();
  const html = buildHtml(report, header);

  // html2pdf needs an element actually mounted in the DOM.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px"; // A4 @ 96dpi
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf()
      .from(container.firstElementChild as HTMLElement)
      .set({
        margin: [10, 10, 10, 10],
        filename: report.filename.endsWith(".pdf")
          ? report.filename
          : `${report.filename}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
