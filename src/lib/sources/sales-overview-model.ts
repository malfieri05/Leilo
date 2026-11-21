export const SOUTHEAST_STATES = ["FL", "GA", "SC", "NC", "MS", "TN", "AL"] as const;

export const regionKeys = ["nationwide", "california", "southeast"] as const;
export type RegionKey = (typeof regionKeys)[number];

export const rangeKeys = ["mtd", "ytd", "ytd-vs", "custom", "all"] as const;
export type RangeKey = (typeof rangeKeys)[number];

export const segmentKeys = ["industry", "customer"] as const;
export type SegmentKey = (typeof segmentKeys)[number];

export const cohortIds = [
  "lifetime",
  "active",
  "at-risk",
  "past",
  "prospects",
  "ordered",
  "one-two",
  "three-plus",
  "year-recent",
  "two-year",
] as const;
export type CohortId = (typeof cohortIds)[number];

export const productFamilies = ["RTDs/Cans", "Kava Extract", "Kava Flakes", "Kava Powders", "Unmapped"] as const;
export type ProductFamily = (typeof productFamilies)[number];

/** URL value for a blank Industry Type or Customer Type inside tier bands. */
export const BLANK_SEGMENT = "__blank__";

export type SalesQuery = {
  region: RegionKey;
  range: RangeKey;
  from: string | null;
  to: string | null;
  segment: SegmentKey;
  segmentValue: string;
  cohort: CohortId | null;
};

export type ResolvedPeriod = {
  key: RangeKey;
  label: string;
  from: string | null;
  to: string | null;
  compareFrom: string | null;
  compareTo: string | null;
};

export type TierAccount = {
  id: string;
  name: string;
  revenue: number;
};

export type TierBand = {
  id: "top5" | "next5" | "to25" | "to50" | "rest";
  label: string;
  accounts: TierAccount[];
  revenue: number;
  share: number;
};

const BANDS: { id: TierBand["id"]; label: string; maxStart: number }[] = [
  { id: "top5", label: "Top 0–5%", maxStart: 0.05 },
  { id: "next5", label: "5–10%", maxStart: 0.1 },
  { id: "to25", label: "10–25%", maxStart: 0.25 },
  { id: "to50", label: "25–50%", maxStart: 0.5 },
  { id: "rest", label: "The other half", maxStart: Number.POSITIVE_INFINITY },
];

export function todayIso(now = new Date(), timeZone = "America/Los_Angeles") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftYears(iso: string, years: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const targetYear = year + years;
  const lastDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return `${targetYear}-${pad(month)}-${pad(Math.min(day, lastDay))}`;
}

export function regionStates(region: RegionKey) {
  if (region === "california") return ["CA"];
  if (region === "southeast") return [...SOUTHEAST_STATES];
  return null;
}

export function regionLabel(region: RegionKey) {
  if (region === "california") return "California";
  if (region === "southeast") return "Southeast";
  return "Nationwide";
}

export function productFamily(sku: string | null, title: string | null): ProductFamily {
  const code = sku?.trim() ?? "";
  const blob = `${code} ${title ?? ""}`.toLowerCase();
  if (/\bflakes?\b/.test(blob)) return "Kava Flakes";
  if (/\bpowders?\b/.test(blob)) return "Kava Powders";
  if (/\bextract\b/.test(blob)) return "Kava Extract";
  if (/\bsticks?\b/.test(blob) || /-stick\b/.test(blob)) return "Unmapped";
  if (/\b(shot|shots|bottle|bottles)\b/.test(blob) || /\b2\s?oz\b/.test(blob)) return "Unmapped";
  if (
    /\b(can|cans|carton|cartons|rtd|tonic)\b/.test(blob) ||
    /\b\d+\s?oz\b/.test(blob) ||
    /\b(\d+-)?packs?\b/.test(blob) ||
    /^fg-(01|04|12|36|72)-/i.test(code)
  ) {
    return "RTDs/Cans";
  }
  return "Unmapped";
}

export function assignTiers(accounts: TierAccount[]): TierBand[] {
  const ranked = accounts
    .filter((account) => account.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
  const total = ranked.reduce((sum, account) => sum + account.revenue, 0);
  const grouped = new Map<TierBand["id"], TierAccount[]>(BANDS.map((band) => [band.id, []]));
  let cumulative = 0;
  for (const account of ranked) {
    const start = total === 0 ? 0 : cumulative / total;
    const band = BANDS.find((item) => start < item.maxStart) ?? BANDS[BANDS.length - 1];
    grouped.get(band.id)?.push(account);
    cumulative += account.revenue;
  }
  return BANDS.map((band) => {
    const rows = grouped.get(band.id) ?? [];
    const revenue = rows.reduce((sum, account) => sum + account.revenue, 0);
    return {
      id: band.id,
      label: band.label,
      accounts: rows,
      revenue,
      share: total === 0 ? 0 : revenue / total,
    };
  });
}

export function parseSalesQuery(
  input: Record<string, string | string[] | undefined>,
  now = new Date(),
): { query: SalesQuery; period: ResolvedPeriod; today: string } {
  const today = todayIso(now);
  const region = oneOf(one(input.region), regionKeys, "nationwide");
  const requested = oneOf(one(input.range), rangeKeys, "ytd");
  const from = validIso(one(input.from));
  const to = validIso(one(input.to));
  const range: RangeKey = requested === "custom" && from && to ? "custom" : requested === "custom" ? "ytd" : requested;
  const segment = oneOf(one(input.segment), segmentKeys, "industry");
  const segmentValue = one(input.segmentValue).trim();
  const cohort = oneOfOrNull(one(input.cohort), cohortIds);
  const query: SalesQuery = {
    region,
    range,
    from: range === "custom" ? from : null,
    to: range === "custom" ? to : null,
    segment,
    segmentValue,
    cohort,
  };
  return { query, period: resolvePeriod(query, today), today };
}

export function resolvePeriod(query: SalesQuery, today: string): ResolvedPeriod {
  if (query.range === "all") {
    return { key: "all", label: "All time", from: null, to: null, compareFrom: null, compareTo: null };
  }
  if (query.range === "custom" && query.from && query.to) {
    const [from, to] = query.from <= query.to ? [query.from, query.to] : [query.to, query.from];
    return {
      key: "custom",
      label: formatSpan(from, to),
      from,
      to,
      compareFrom: shiftYears(from, -1),
      compareTo: shiftYears(to, -1),
    };
  }
  const [year, month] = today.split("-");
  const from = query.range === "mtd" ? `${year}-${month}-01` : `${year}-01-01`;
  const label =
    query.range === "mtd" ? "Month to date" : query.range === "ytd-vs" ? "YTD vs last year" : "Year to date";
  return {
    key: query.range === "mtd" ? "mtd" : query.range === "ytd-vs" ? "ytd-vs" : "ytd",
    label,
    from,
    to: today,
    compareFrom: shiftYears(from, -1),
    compareTo: shiftYears(today, -1),
  };
}

export function salesQueryString(query: SalesQuery, patch: Partial<SalesQuery> = {}) {
  const next: SalesQuery = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.region !== "nationwide") params.set("region", next.region);
  if (next.range !== "ytd") params.set("range", next.range);
  if (next.range === "custom" && next.from && next.to) {
    params.set("from", next.from);
    params.set("to", next.to);
  }
  if (next.segment !== "industry") params.set("segment", next.segment);
  if (next.segmentValue) params.set("segmentValue", next.segmentValue);
  if (next.cohort) params.set("cohort", next.cohort);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function segmentLabel(value: string) {
  if (!value) return "All";
  if (value === BLANK_SEGMENT) return "Needs a type";
  return value;
}

export function cohortTitle(id: CohortId) {
  switch (id) {
    case "lifetime":
      return "Lifetime accounts";
    case "active":
      return "Active accounts";
    case "at-risk":
      return "At Risk accounts";
    case "past":
      return "Past customers";
    case "prospects":
      return "Prospects";
    case "ordered":
      return "Accounts that ordered";
    case "one-two":
      return "1–2 orders, then quiet";
    case "three-plus":
      return "3 or more orders";
    case "year-recent":
      return "Ordered again in 90 days";
    case "two-year":
      return "Active among two-year buyers";
  }
}

export function formatSpan(from: string, to: string) {
  return `${formatDay(from)} – ${formatDay(to)}`;
}

function formatDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function one(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function oneOfOrNull<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function validIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return value;
}
