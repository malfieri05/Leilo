import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import {
  hubspotIndustryCte,
  hubspotIndustryJoin,
  resolvedCustomerSql,
  resolvedIndustrySql,
  resolvedOrderingMethodSql,
} from "@/lib/sources/direct-model";

export type AccountRow = {
  externalId: string;
  name: string;
  customerType: string | null;
  orderingMethod: string | null;
  industryType: string | null;
  region: string | null;
  source: string;
};

export type CountRow = { label: string; count: number };

export type AccountCounts =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      total: number;
      bySource: CountRow[];
      byCustomerType: CountRow[];
      byOrderingMethod: CountRow[];
    };

export type AccountList =
  | { state: "no-database" }
  | { state: "empty"; total: number }
  | { state: "error"; message: string }
  | { state: "ready"; rows: AccountRow[]; total: number };

export type EnrichedAccountRow = {
  id: string;
  externalId: string;
  name: string;
  region: string | null;
  industryType: string | null;
  customerType: string | null;
  hubspotOrderingMethod: string | null;
  hubspotMatched: boolean;
  hubspotExternalId: string | null;
  needsType: boolean;
};

export type EnrichedAccountList =
  | { state: "no-database" }
  | { state: "empty"; total: number }
  | { state: "error"; message: string }
  | { state: "ready"; rows: EnrichedAccountRow[]; total: number };

export type EnrichmentStats =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      shopifyAccounts: number;
      hubspotMatched: number;
      withIndustry: number;
      needsType: number;
    };

type ListInput = {
  source?: string;
  prospects?: boolean;
  limit?: number;
  offset?: number;
};

type EnrichedListInput = {
  needsType?: boolean;
  needsHubSpotMatch?: boolean;
  limit?: number;
  offset?: number;
};

const HUBSPOT_COMPANY_URL = "https://app.hubspot.com/contacts/21506788/company";

export async function accountCounts(source?: string): Promise<AccountCounts> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const filter = where({ organizationId, source });
    const [totalRows, bySource, byCustomerType, byOrderingMethod] = await Promise.all([
      sql.query(
        `SELECT COUNT(*)::int AS count FROM accounts ${filter.clause}`,
        filter.params,
      ),
      sql.query(
        `SELECT source AS label, COUNT(*)::int AS count
         FROM accounts ${filter.clause}
         GROUP BY source
         ORDER BY count DESC, source`,
        filter.params,
      ),
      sql.query(
        `SELECT COALESCE(NULLIF(btrim(customer_type), ''), 'Unset') AS label, COUNT(*)::int AS count
         FROM accounts ${filter.clause}
         GROUP BY 1
         ORDER BY count DESC, label`,
        filter.params,
      ),
      sql.query(
        `SELECT COALESCE(NULLIF(btrim(ordering_method), ''), 'Unset') AS label, COUNT(*)::int AS count
         FROM accounts ${filter.clause}
         GROUP BY 1
         ORDER BY count DESC, label`,
        filter.params,
      ),
    ]);

    return {
      state: "ready",
      total: Number(rowAt(totalRows, 0).count ?? 0),
      bySource: asCounts(bySource),
      byCustomerType: asCounts(byCustomerType),
      byOrderingMethod: asCounts(byOrderingMethod),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export function hubspotCompanyUrl(hubspotExternalId: string | null) {
  if (!hubspotExternalId) return null;
  return `${HUBSPOT_COMPANY_URL}/${hubspotExternalId}`;
}

export async function accountEnrichmentStats(sql: Sql, organizationId: string): Promise<EnrichmentStats> {
  const needsType = `NULLIF(btrim(${resolvedIndustrySql()}), '') IS NULL`;
  try {
    const result = asRows(
      await sql.query(
        `WITH ${hubspotIndustryCte()}
         SELECT
           COUNT(*)::int AS shopify_accounts,
           COUNT(*) FILTER (WHERE h.hubspot_external_id IS NOT NULL)::int AS hubspot_matched,
           COUNT(*) FILTER (WHERE NULLIF(btrim(${resolvedIndustrySql()}), '') IS NOT NULL)::int AS with_industry,
           COUNT(*) FILTER (WHERE ${needsType})::int AS needs_type
         FROM accounts a
         ${hubspotIndustryJoin()}
         WHERE a.organization_id = $1
           AND a.source = 'shopify'`,
        [organizationId],
      ),
    );
    const row = result[0] ?? {};
    return {
      state: "ready",
      shopifyAccounts: Number(row.shopify_accounts ?? 0),
      hubspotMatched: Number(row.hubspot_matched ?? 0),
      withIndustry: Number(row.with_industry ?? 0),
      needsType: Number(row.needs_type ?? 0),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export async function loadEnrichmentStats(): Promise<EnrichmentStats> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };
  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    return accountEnrichmentStats(sql, organizationId);
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export async function listEnrichedShopifyAccounts(input: EnrichedListInput = {}): Promise<EnrichedAccountList> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  const limit = clamp(input.limit ?? 100, 1, 200);
  const offset = Math.max(input.offset ?? 0, 0);

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const params: unknown[] = [organizationId];
    const parts = ["a.organization_id = $1", "a.source = 'shopify'"];
    const needsType = `NULLIF(btrim(${resolvedIndustrySql()}), '') IS NULL`;
    if (input.needsType) parts.push(needsType);
    if (input.needsHubSpotMatch) parts.push("h.hubspot_external_id IS NULL");
    const where = parts.join(" AND ");

    const [countRows, rows] = await Promise.all([
      sql.query(
        `WITH ${hubspotIndustryCte()}
         SELECT COUNT(*)::int AS count
         FROM accounts a
         ${hubspotIndustryJoin()}
         WHERE ${where}`,
        params,
      ),
      sql.query(
        `WITH ${hubspotIndustryCte()}
         SELECT
           a.id::text AS id,
           a.external_id,
           a.name,
           a.region,
           NULLIF(btrim(${resolvedIndustrySql()}), '') AS industry_type,
           NULLIF(btrim(${resolvedCustomerSql()}), '') AS customer_type,
           NULLIF(btrim(${resolvedOrderingMethodSql()}), '') AS hubspot_ordering_method,
           h.hubspot_external_id,
           (${needsType}) AS needs_type
         FROM accounts a
         ${hubspotIndustryJoin()}
         WHERE ${where}
         ORDER BY a.name
         LIMIT $${params.length + 1}
         OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
    ]);
    const total = Number(rowAt(countRows, 0).count ?? 0);
    if (total === 0) return { state: "empty", total: 0 };
    return {
      state: "ready",
      total,
      rows: asRows(rows).map((row) => ({
        id: String(row.id),
        externalId: String(row.external_id),
        name: String(row.name),
        region: blank(row.region),
        industryType: blank(row.industry_type),
        customerType: blank(row.customer_type),
        hubspotOrderingMethod: blank(row.hubspot_ordering_method),
        hubspotMatched: Boolean(row.hubspot_external_id),
        hubspotExternalId: blank(row.hubspot_external_id),
        needsType: Boolean(row.needs_type),
      })),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export async function listAccounts(input: ListInput = {}): Promise<AccountList> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  const limit = clamp(input.limit ?? 50, 1, 200);
  const offset = Math.max(input.offset ?? 0, 0);

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const filter = where({ organizationId, source: input.source, prospects: input.prospects });
    const [countRows, rows] = await Promise.all([
      sql.query(`SELECT COUNT(*)::int AS count FROM accounts ${filter.clause}`, filter.params),
      sql.query(
        `SELECT external_id, name, customer_type, ordering_method, industry_type, region, source
         FROM accounts ${filter.clause}
         ORDER BY name
         LIMIT $${filter.params.length + 1}
         OFFSET $${filter.params.length + 2}`,
        [...filter.params, limit, offset],
      ),
    ]);
    const total = Number(rowAt(countRows, 0).count ?? 0);
    if (total === 0) return { state: "empty", total: 0 };
    return {
      state: "ready",
      total,
      rows: asRows(rows).map((row) => ({
        externalId: String(row.external_id),
        name: String(row.name),
        customerType: blank(row.customer_type),
        orderingMethod: blank(row.ordering_method),
        industryType: blank(row.industry_type),
        region: blank(row.region),
        source: String(row.source),
      })),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

function where(input: { organizationId: string; source?: string; prospects?: boolean }) {
  const params: unknown[] = [input.organizationId];
  const parts = ["organization_id = $1"];
  if (input.source) {
    params.push(input.source);
    parts.push(`source = $${params.length}`);
  }
  if (input.prospects) {
    parts.push(`(
      customer_type IS NULL
      OR btrim(customer_type) = ''
      OR customer_type ILIKE 'prospect'
    )`);
  }
  return { clause: `WHERE ${parts.join(" AND ")}`, params };
}

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function rowAt(value: unknown, index: number) {
  return asRows(value)[index] ?? {};
}

function asCounts(value: unknown): CountRow[] {
  return asRows(value).map((row) => ({ label: String(row.label), count: Number(row.count) }));
}

function blank(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
