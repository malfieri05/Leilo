import { stableId } from "@/lib/sources/fields";
import { normalizeSpinsRow, type SpinsPeriodWeeks, type SpinsReportKind } from "@/lib/sources/spins-model";
import type { PullResult } from "@/lib/sources/types";

export function parseSpinsExport(
  rows: Record<string, string>[],
  reportKind: SpinsReportKind,
  periodWeeks: SpinsPeriodWeeks,
): PullResult {
  const kept = rows.slice(0, 5000);
  const spinsRows = kept.map((row) => normalizeSpinsRow(row, { reportKind, periodWeeks }));
  const visible = spinsRows.filter((row) => row.included).length;
  const truncated = rows.length > kept.length;
  return {
    message: `Stored ${kept.length} SPINS rows for ${reportKind} ${periodWeeks} weeks. ${visible} stay in SPINS views. 4-packs and items under $2,000 are left out of those views.${truncated ? " The file was longer than 5,000 rows." : ""}`,
    rowCount: kept.length,
    accounts: [],
    orders: [],
    shipments: [],
    spinsRows,
    raw: spinsRows.map((row, index) => ({
      kind: "category" as const,
      externalId: stableId([reportKind, String(periodWeeks), String(index), JSON.stringify(row.payload)]),
      payload: { ...row.payload, includeInSpinsView: row.included },
    })),
  };
}
