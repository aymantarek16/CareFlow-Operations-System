/**
 * Backup / export utilities.
 *
 * Generates CSV, Excel (.xlsx) or JSON files from arbitrary row sets and
 * triggers a browser download. Also exposes a "full backup" that fetches
 * every relevant table from Supabase and bundles them into a single JSON file.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export type BackupColumn<T> = {
  key: keyof T | string;
  label: string;
  /** Optional accessor for computed / nested fields. */
  accessor?: (row: T) => unknown;
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function normalizeCell(value: unknown): string | number {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "number") return value;
  return String(value);
}

function buildMatrix<T>(
  rows: T[],
  columns: BackupColumn<T>[],
): { header: string[]; body: (string | number)[][] } {
  const header = columns.map((c) => c.label);
  const body = rows.map((row) =>
    columns.map((c) => {
      const raw = c.accessor
        ? c.accessor(row)
        : (row as Record<string, unknown>)[c.key as string];
      return normalizeCell(raw);
    }),
  );
  return { header, body };
}

export function exportCsv<T>(
  filename: string,
  rows: T[],
  columns: BackupColumn<T>[],
) {
  const { header, body } = buildMatrix(rows, columns);
  const csv = Papa.unparse({ fields: header, data: body });
  // Prepend UTF-8 BOM so Excel opens Arabic correctly.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(
    blob,
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
}

export function exportExcel<T>(
  filename: string,
  rows: T[],
  columns: BackupColumn<T>[],
  sheetName = "Sheet1",
) {
  const { header, body } = buildMatrix(rows, columns);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  // Right-to-left worksheet so Arabic reads correctly in Excel.
  ws["!views"] = [{ RTL: true }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(
    wb,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function exportJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(
    blob,
    filename.endsWith(".json") ? filename : `${filename}.json`,
  );
}

/**
 * Tables pulled during a full backup. We list them explicitly rather than
 * introspecting so we can guarantee a predictable output shape.
 */
export const BACKUP_TABLES = [
  "users",
  "patients",
  "doctors",
  "appointments",
  "medical_records",
  "prescriptions",
  "invoices",
  "departments",
  "system_settings",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

export type FullBackup = {
  exportedAt: string;
  version: 1;
  tables: Record<BackupTable, unknown[]>;
};

/** Fetches every backup table and returns a single JSON payload. */
export async function fetchFullBackup(): Promise<FullBackup> {
  const tables = {} as Record<BackupTable, unknown[]>;
  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
    tables[table] = data ?? [];
  }
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    tables,
  };
}

/** Fetches a single table (respecting RLS). */
export async function fetchTable<T = unknown>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}
