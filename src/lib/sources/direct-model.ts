import type { RegionKey } from "@/lib/sources/sales-overview-model";

/** HubSpot Industry Type values Weston uses to keep DSD distributors out of Direct. */
export const DIRECT_DISTRIBUTOR_INDUSTRIES = ["Independent Distributor", "Regional Distributor"] as const;

export function isDirectDistributorIndustry(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed === "independent distributor" || trimmed === "regional distributor";
}

/** Shopify industry wins when it is set. A blank on both sides is Needs a type. */
export function resolvedIndustryType(shopifyIndustry: string | null | undefined, hubspotIndustry: string | null | undefined) {
  const shopify = shopifyIndustry?.trim() ?? "";
  if (shopify) return shopify;
  const hubspot = hubspotIndustry?.trim() ?? "";
  return hubspot || "Needs a type";
}

/** One HubSpot company per name. Queries bind the organization as `$1`. */
export function hubspotIndustryCte() {
  return `hubspot_industry AS (
    SELECT DISTINCT ON (lower(btrim(name)))
      lower(btrim(name)) AS name_key,
      NULLIF(btrim(industry_type), '') AS industry_type,
      NULLIF(btrim(customer_type), '') AS customer_type
    FROM accounts
    WHERE organization_id = $1
      AND source = 'hubspot'
    ORDER BY lower(btrim(name)), (NULLIF(btrim(industry_type), '') IS NULL), updated_at DESC
  )`;
}

export function hubspotIndustryJoin() {
  return `LEFT JOIN hubspot_industry h ON h.name_key = lower(btrim(a.name))`;
}

export function resolvedIndustrySql() {
  return `COALESCE(NULLIF(btrim(a.industry_type), ''), NULLIF(btrim(h.industry_type), ''), '')`;
}

export function distributorIndustryPredicate() {
  return `lower(btrim(${resolvedIndustrySql()})) IN ('independent distributor', 'regional distributor')`;
}

/** Confident Shopify Direct, with distributor industries removed. `tagParam` is a `$n` slot. */
export function directOrderPredicate(tagParam: string) {
  return `o.ordering_method = 'Direct'
    AND o.direction = 'direct'
    AND o.exclude_from_direct = false
    AND o.revenue > 0
    AND NOT (COALESCE(o.tags, '') ~* ${tagParam})
    AND NOT (${distributorIndustryPredicate()})`;
}

/** Warehouse invoices stay in Nationwide. California and the Southeast drop them. */
export function warehouseAccountSql(region: RegionKey) {
  if (region === "nationwide") return "";
  return `AND a.name !~* '\\m(kehe|unfi)\\M'`;
}
