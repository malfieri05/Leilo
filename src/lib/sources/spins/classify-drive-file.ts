import {
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  spinsPartnerSlug,
  type SpinsPeriodWeeks,
  type SpinsReportKind,
} from "@/lib/sources/spins-model";

export type SpinsDriveTarget = {
  reportKind: SpinsReportKind;
  periodWeeks: SpinsPeriodWeeks;
  slug: string;
};

/** Map a Google Drive filename to report kind and week window when possible. */
export function classifySpinsDriveFile(name: string): SpinsDriveTarget | null {
  const lower = name.toLowerCase();

  if (shouldSkipName(lower)) return null;

  const reportKind = detectReportKind(lower);
  if (!reportKind) return null;

  const periodWeeks = detectPeriodWeeks(lower);
  if (!periodWeeks) return null;

  return {
    reportKind,
    periodWeeks,
    slug: spinsPartnerSlug(reportKind, periodWeeks),
  };
}

function shouldSkipName(lower: string) {
  if (/raw export|investor|total spirits/.test(lower)) return true;
  if (/(?:item|brand)\s*ra(?:nk)?|sprouts|item\s*matrix/.test(lower)) return false;
  if (/\d{1,2}\/\d{1,2}/.test(lower) && !/\d+\s*week/.test(lower)) return true;
  return false;
}

function detectReportKind(lower: string): SpinsReportKind | null {
  if (/item\s*rank/.test(lower) && !/summary|postcard/.test(lower)) return "item-rank";
  if (/brand\s*ra(?:nk)?(?:\b|\.)/.test(lower)) return "brand-rank";
  if (/brand\s*rank/.test(lower)) return "brand-rank";
  if (/12\s*week\s*data/.test(lower) && /competitor|leilo/.test(lower)) return "brand-rank";
  if (/sprouts|item\s*matrix/.test(lower)) return "sprouts-matrix";
  if (/category/.test(lower) && /leilo/.test(lower)) return "brand-rank";
  if (/spins\s*-\s*leilo/.test(lower) && !/item/.test(lower)) return "brand-rank";
  if (/rolling\s*4|spins\s*l4\b/.test(lower) && !/item/.test(lower)) return "brand-rank";
  if (/rolling\s*4/.test(lower) && /item/.test(lower)) return "item-rank";
  if (/\bspins\b/.test(lower) && /item/.test(lower)) return "item-rank";
  if (/\bspins\b/.test(lower) && /\b4\s*week/.test(lower) && !/item|brand/.test(lower)) return "brand-rank";
  return null;
}

function detectPeriodWeeks(lower: string): SpinsPeriodWeeks | null {
  const candidates: SpinsPeriodWeeks[] = [];
  if (/\b52\s*(-|\s*)?week|\b52w\b|[\s_-]52(?:w)?\b/.test(lower)) candidates.push(52);
  if (/\b24\s*(-|\s*)?week|\b24w\b|[\s_-]24(?:w)?\b/.test(lower)) candidates.push(24);
  if (/\b12\s*(-|\s*)?week|\b12w\b|\bl12\b|[\s_-]12(?:w)?\b|\(12w/.test(lower)) candidates.push(12);
  if (/\b4\s*(-|\s*)?week|\b4w\b|\bl4\b|rolling\s*4|[\s_-]4(?:w)?\b/.test(lower)) candidates.push(4);

  for (const weeks of SPINS_PERIOD_WEEKS) {
    if (candidates.includes(weeks)) return weeks;
  }
  return null;
}

export function isSpinsReportKind(value: string): value is SpinsReportKind {
  return SPINS_REPORT_KINDS.includes(value as SpinsReportKind);
}

export function isSpinsPeriodWeeks(value: number): value is SpinsPeriodWeeks {
  return SPINS_PERIOD_WEEKS.includes(value as SpinsPeriodWeeks);
}