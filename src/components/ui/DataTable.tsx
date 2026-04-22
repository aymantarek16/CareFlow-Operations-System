import { ReactNode } from "react";

export function DataTable({ columns, rows, emptyMessage = "لا توجد بيانات لعرضها الآن." }: {
  columns: string[]; rows: ReactNode[][]; emptyMessage?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-foreground/10 bg-background/50">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.04] text-right">
              {columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-4 font-semibold text-foreground/70">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, idx) => (
              <tr key={idx} className="border-b border-foreground/6 transition hover:bg-foreground/[0.03]">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-4 align-top text-foreground/88">{cell}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-10 text-center text-foreground/45" colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
