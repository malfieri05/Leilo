import { zoomInfoAccessToken } from "@/lib/sources/connectors/zoominfo/auth";
import { accountsFromHits, searchCompanies } from "@/lib/sources/connectors/zoominfo/search";
import { emptyPull } from "@/lib/sources/persist";
import type { AccountDraft, PullResult } from "@/lib/sources/types";
import {
  zoomInfoCompanyNameSearches,
  zoomInfoIndustrySearches,
  zoomInfoStateFilter,
} from "@/lib/sources/zoominfo-model";

const PAGE_SIZE = 25;

export async function pullZoomInfo(): Promise<PullResult> {
  const token = await zoomInfoAccessToken();
  const state = zoomInfoStateFilter();
  const byId = new Map<string, AccountDraft>();
  const notes: string[] = [];

  for (const keywords of zoomInfoIndustrySearches()) {
    const hits = await searchCompanies(token, { industryKeywords: keywords, state: state ?? undefined }, 1, PAGE_SIZE);
    for (const account of accountsFromHits(hits)) byId.set(account.externalId, account);
    notes.push(`industry "${keywords}": ${hits.length} companies`);
  }

  for (const companyName of zoomInfoCompanyNameSearches()) {
    const hits = await searchCompanies(token, { companyName, state: state ?? undefined }, 1, PAGE_SIZE);
    for (const account of accountsFromHits(hits)) byId.set(account.externalId, account);
    notes.push(`name "${companyName}": ${hits.length} companies`);
  }

  const accounts = [...byId.values()];
  const result = emptyPull("");
  result.accounts = accounts;
  result.raw.push({
    kind: "reference",
    externalId: "zoominfo-company-search",
    payload: { searchNotes: notes, count: accounts.length },
  });
  result.rowCount = accounts.length;
  result.message =
    accounts.length === 0
      ? `ZoomInfo returned no companies. ${notes.join(". ")}. Tune ZOOMINFO_INDUSTRY_KEYWORDS or ZOOMINFO_COMPANY_NAMES.`
      : `ZoomInfo stored ${accounts.length} prospect companies. ${notes.join(". ")}.`;
  return result;
}