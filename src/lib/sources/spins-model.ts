import { blankToNull, includeInSpinsView, money, pick, quantity } from "@/lib/sources/fields";
import { regionKeys, regionStates, type RegionKey } from "@/lib/sources/sales-overview-model";
import type { SpinsRowDraft } from "@/lib/sources/types";

export const SPINS_REPORT_KINDS = ["brand-rank", "item-rank", "sprouts-matrix"] as const;
export type SpinsReportKind = (typeof SPINS_REPORT_KINDS)[number];

export const SPINS_PERIOD_WEEKS = [4, 12, 24, 52] as const;
export type SpinsPeriodWeeks = (typeof SPINS_PERIOD_WEEKS)[number];

export const SPINS_SCOPES = ["competitors", "all"] as const;
export type SpinsScope = (typeof SPINS_SCOPES)[number];

/** Comparison brands Weston pulls from SPINS. Separate from the lead-generation locator list. */
export const SPINS_COMPETITOR_BRANDS = [
  "Hiyo",
  "Recess",
  "Kin Euphorics",
  "Ghia",
  "De Soi",
  "Kava Haven",
  "Melo",
  "Kaviva",
  "Brez",
  "Little Saints",
  "The NA Bev Co",
  "Parch",
  "Free AF",
  "Aplos",
  "Three Spirit",
  "Edna's",
  "Naked Life",
  "Mingle",
  "Trip",
  "Moment",
  "Mocktail Club",
  "Luna Bay",
] as const;

const COMPETITOR_KEYS = new Set(SPINS_COMPETITOR_BRANDS.map((brand) => normalizeBrandName(brand)));

const STATE_NAMES: Record<string, string> = {
  CA: "CALIFORNIA",
  FL: "FLORIDA",
  GA: "GEORGIA",
  SC: "SOUTH CAROLINA",
  NC: "NORTH CAROLINA",
  MS: "MISSISSIPPI",
  TN: "TENNESSEE",
  AL: "ALABAMA",
};

export type SpinsQuery = {
  report: SpinsReportKind;
  weeks: SpinsPeriodWeeks;
  region: RegionKey;
  scope: SpinsScope;
};

export function spinsPartnerSlug(report: SpinsReportKind, weeks: SpinsPeriodWeeks) {
  return `${report}:${weeks}w`;
}

export function reportLabel(report: SpinsReportKind) {
  if (report === "brand-rank") return "Brand Rank";
  if (report === "item-rank") return "Item Rank";
  return "Sprouts Item Matrix";
}

export function normalizeBrandName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isLeiloBrand(value: string | null | undefined) {
  const key = normalizeBrandName(value ?? "");
  return key === "leilo" || key.startsWith("leilo ");
}

export function matchesCompetitorSet(value: string | null | undefined) {
  const key = normalizeBrandName(value ?? "");
  return key.length > 0 && COMPETITOR_KEYS.has(key);
}

export function includedInSpinsView(row: Record<string, string>) {
  return includeInSpinsView(row);
}

export function geographyTokens(region: RegionKey) {
  const states = regionStates(region);
  if (!states) return null;
  return states.flatMap((code) => [code, STATE_NAMES[code]].filter((token): token is string => Boolean(token)));
}

export function parseSpinsQuery(input: Record<string, string | string[] | undefined>): SpinsQuery {
  const report = oneOf(one(input.report), SPINS_REPORT_KINDS, "brand-rank");
  const weeks = oneOf(Number(one(input.weeks)), SPINS_PERIOD_WEEKS, 12);
  const region = oneOf(one(input.region), regionKeys, "nationwide");
  const scope = oneOf(one(input.scope), SPINS_SCOPES, "competitors");
  return { report, weeks, region, scope };
}

export function spinsQueryString(query: SpinsQuery, patch: Partial<SpinsQuery> = {}) {
  const next: SpinsQuery = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.report !== "brand-rank") params.set("report", next.report);
  if (next.weeks !== 12) params.set("weeks", String(next.weeks));
  if (next.region !== "nationwide") params.set("region", next.region);
  if (next.scope !== "competitors") params.set("scope", next.scope);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function normalizeSpinsRow(
  row: Record<string, string>,
  meta: { reportKind: SpinsReportKind; periodWeeks: SpinsPeriodWeeks },
): SpinsRowDraft {
  const dollars = money(pick(row, ["dollar sales", "sales dollars", "dollars", "$", "revenue", "amount", "total $", "total"]));
  const unitsText = pick(row, ["unit sales", "units", "unit qty", "qty"]);
  const rankText = pick(row, ["rank", "brand rank", "item rank"]);
  const dollarsPct = percent(pick(row, ["dollar sales % chg", "dollars % chg", "$ % chg", "dollar % chg", "% chg"]));
  const unitsPct = percent(pick(row, ["unit sales % chg", "units % chg", "unit % chg"]));
  return {
    reportKind: meta.reportKind,
    periodWeeks: meta.periodWeeks,
    brand: blankToNull(pick(row, ["brand", "brand name", "manufacturer"])),
    itemLabel: blankToNull(pick(row, ["item", "item description", "description", "product description", "product"])),
    upc: blankToNull(pick(row, ["upc", "upc code", "gtin"])),
    retailer: blankToNull(pick(row, ["retailer", "banner", "account", "chain", "store name", "store"])),
    geography: blankToNull(pick(row, ["geography", "state", "market", "region"])),
    dollars,
    units: unitsText.trim() ? quantity(unitsText) : null,
    rank: rankText.trim() ? integer(rankText) : null,
    dollarsPct,
    unitsPct,
    included: includeInSpinsView(row),
    payload: row,
  };
}

function percent(value: string) {
  const cleaned = value.replace(/[%\s,]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function integer(value: string) {
  const amount = quantity(value);
  if (amount === null) return null;
  return Math.trunc(amount);
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function oneOf<T extends string | number>(value: string | number, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
