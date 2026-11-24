import type { SpinsPeriodWeeks, SpinsReportKind } from "@/lib/sources/spins-model";

export type SpinsDriveCatalogEntry = {
  fileId: string;
  report: SpinsReportKind;
  weeks: SpinsPeriodWeeks;
  name: string;
  note?: string;
};

/**
 * Pinned Drive files per report window. Overrides auto filename matching when the same slug
 * is found (e.g. prefer full Item Rank export over a dated summary workbook).
 */
export const SPINS_DRIVE_CATALOG: SpinsDriveCatalogEntry[] = [
  {
    fileId: "1srodiPINTMu7DBa7Q1bP_kefqq-cmG_L",
    report: "brand-rank",
    weeks: 4,
    name: "11-1-26 brand rank 4 week.xlsx",
    note: "SPINS ARK DATA",
  },
  {
    fileId: "1lAXW9JY5waOjY3PsWNpdtm7FhA6dXCPr",
    report: "brand-rank",
    weeks: 12,
    name: "11-1-26 brand rank 12 week.xlsx",
    note: "SPINS ARK DATA",
  },
  {
    fileId: "1hlc2ET-QP0Zyai3ZaV_Xad0a04wFJRLW",
    report: "brand-rank",
    weeks: 24,
    name: "11-1-26 brand rank 24 week.xlsx",
    note: "SPINS ARK DATA",
  },
  {
    fileId: "1MaoQbwfnvF87m5t2x_sg0OGnDeH64CbZ",
    report: "brand-rank",
    weeks: 52,
    name: "11-1-26 brand rank 52 week.xlsx",
    note: "SPINS ARK DATA",
  },
  {
    fileId: "1deGbCEqWBq9ss_gSWUpjZ28w_4gNxoXa",
    report: "item-rank",
    weeks: 12,
    name: "Leilo v Category Item Rank 12w.xlsx",
    note: "Full category item rank (~82 rows). Not the 8.20.26 summary file.",
  },
];