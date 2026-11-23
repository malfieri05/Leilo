import type { AccountDraft } from "@/lib/sources/types";

const SEARCH_URL = "https://api.zoominfo.com/gtm/data/v1/companies/search";
const USER_AGENT = "leilo-ark/1.0";

export type CompanySearchAttributes = {
  companyName?: string;
  industryKeywords?: string;
  state?: string;
};

type SearchHit = {
  id?: string;
  attributes?: Record<string, unknown>;
};

export async function searchCompanies(
  token: string,
  attributes: CompanySearchAttributes,
  page = 1,
  pageSize = 25,
): Promise<SearchHit[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("page[number]", String(page));
  url.searchParams.set("page[size]", String(Math.min(Math.max(pageSize, 1), 100)));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/vnd.api+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/vnd.api+json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      data: { type: "CompanySearch", attributes: compactAttributes(attributes) },
    }),
  });

  if (response.status === 401) throw new Error("ZoomInfo access token expired or is invalid.");
  if (response.status === 403) {
    throw new Error("ZoomInfo denied this search. Confirm API scopes and the integration user on the app.");
  }
  if (!response.ok) throw new Error(`ZoomInfo company search failed (${response.status}).`);

  const body = (await response.json()) as { data?: SearchHit[] };
  return body.data ?? [];
}

export function accountsFromHits(hits: SearchHit[]): AccountDraft[] {
  const accounts: AccountDraft[] = [];
  for (const hit of hits) {
    const attrs = hit.attributes ?? {};
    const name = text(attrs.name);
    const id = text(hit.id);
    if (!name || !id) continue;
    const city = text(attrs.city);
    const state = text(attrs.state);
    const street = text(attrs.address);
    accounts.push({
      externalId: id,
      name,
      address: [street, city, state].filter(Boolean).join(", ") || null,
      region: state || null,
      industryType: text(attrs.industry) || text(attrs.subIndustry) || null,
      customerType: "Prospect",
      orderingMethod: null,
    });
  }
  return accounts;
}

function compactAttributes(attributes: CompanySearchAttributes) {
  const out: Record<string, string> = {};
  if (attributes.companyName?.trim()) out.companyName = attributes.companyName.trim();
  if (attributes.industryKeywords?.trim()) out.industryKeywords = attributes.industryKeywords.trim();
  if (attributes.state?.trim()) out.state = attributes.state.trim();
  return out;
}

function text(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}