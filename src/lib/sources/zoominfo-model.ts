/** Default retail lookalike searches until Weston tunes ZOOMINFO_INDUSTRY_KEYWORDS. */
export const DEFAULT_ZOOMINFO_INDUSTRY_KEYWORDS = [
  "kava bar",
  "natural foods store",
  "health food retailer",
];

export function zoomInfoIndustrySearches() {
  const raw = process.env.ZOOMINFO_INDUSTRY_KEYWORDS?.trim() ?? "";
  const terms = raw
    ? raw.split(",").map((term) => term.trim()).filter(Boolean)
    : DEFAULT_ZOOMINFO_INDUSTRY_KEYWORDS;
  return terms.slice(0, 8);
}

export function zoomInfoCompanyNameSearches() {
  const raw = process.env.ZOOMINFO_COMPANY_NAMES?.trim() ?? "";
  if (!raw) return [];
  return raw.split(",").map((term) => term.trim()).filter(Boolean).slice(0, 8);
}

export function zoomInfoStateFilter() {
  const raw = process.env.ZOOMINFO_STATE?.trim() ?? "";
  return raw || null;
}