import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import {
  directOrderPredicate,
  hubspotIndustryCte,
  hubspotIndustryJoin,
  resolvedIndustrySql,
  warehouseAccountSql,
} from "@/lib/sources/direct-model";
import { NON_REVENUE_TAG_REGEX } from "@/lib/sources/revenue-classification";
import { REVENUE_ORDER_SOURCE } from "@/lib/sources/revenue";
import {
  addDays,
  productFamilies,
  productFamily,
  regionStates,
  type ProductFamily,
  type RegionKey,
  type ResolvedPeriod,
} from "@/lib/sources/sales-overview-model";

export type DirectOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      revenue: number;
      priorRevenue: number | null;
      skusCarried: number;
      pods: number;
      skus: { sku: string; revenue: number; pods: number }[];
      families: { family: ProductFamily; revenue: number }[];
      industry: { type: string; accounts: number; revenue: number; share: number }[];
      active30: number;
      active60: number;
      active90: number;
      shopifySyncedAt: string | null;
      hubspotSyncedAt: string | null;
    };

export async function loadDirectOverview(
  region: RegionKey,
  period: ResolvedPeriod,
  today: string,
): Promise<DirectOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [sales, cuts, activity, syncs, industry] = await Promise.all([
      salesTotals(sql, organizationId, region, period),
      skuCuts(sql, organizationId, region, period),
      activityWindows(sql, organizationId, region, today),
      syncTimes(sql, organizationId),
      industryTotals(sql, organizationId, region, period),
    ]);
    return {
      state: "ready",
      revenue: sales.revenue,
      priorRevenue: period.compareFrom ? sales.priorRevenue : null,
      skusCarried: sales.skus,
      pods: sales.pods,
      skus: cuts.skus,
      families: cuts.families,
      industry,
      active30: activity.d30,
      active60: activity.d60,
      active90: activity.d90,
      shopifySyncedAt: syncs.shopify,
      hubspotSyncedAt: syncs.hubspot,
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

function scope(region: RegionKey, params: unknown[]) {
  return `${directOrderPredicate("$3")} ${accountRegion(region, params)} ${warehouseAccountSql(region)}`;
}

async function salesTotals(sql: Sql, organizationId: string, region: RegionKey, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const where = scope(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const prior = between("o.ship_date", period.compareFrom, period.compareTo, params);
  const money = first(
    await sql.query(
      `WITH ${hubspotIndustryCte()}
       SELECT
         COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${prior}), 0) AS prior_revenue
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       ${hubspotIndustryJoin()}
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${where}`,
      params,
    ),
  );
  const cutParams: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const cutWhere = scope(region, cutParams);
  const cutCurrent = between("o.ship_date", period.from, period.to, cutParams);
  const cuts = first(
    await sql.query(
      `WITH ${hubspotIndustryCte()}
       SELECT
         COUNT(DISTINCT l.sku) FILTER (WHERE l.sku IS NOT NULL AND btrim(l.sku) <> '')::int AS skus,
         COUNT(DISTINCT (o.account_id::text || '|' || l.sku)) FILTER (
           WHERE o.account_id IS NOT NULL AND l.sku IS NOT NULL AND btrim(l.sku) <> ''
         )::int AS pods
       FROM orders o
       JOIN order_lines l ON l.order_id = o.id
       LEFT JOIN accounts a ON a.id = o.account_id
       ${hubspotIndustryJoin()}
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${cutWhere}
         AND ${cutCurrent}`,
      cutParams,
    ),
  );
  return {
    revenue: num(money.revenue),
    priorRevenue: num(money.prior_revenue),
    skus: num(cuts.skus),
    pods: num(cuts.pods),
  };
}

async function skuCuts(sql: Sql, organizationId: string, region: RegionKey, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const where = scope(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const rows = asRows(
    await sql.query(
      `WITH ${hubspotIndustryCte()}
       SELECT
         COALESCE(NULLIF(btrim(l.sku), ''), 'No SKU') AS sku,
         COALESCE(l.product_type, '') AS title,
         SUM(COALESCE(l.revenue, 0)) AS revenue,
         COUNT(DISTINCT o.account_id) FILTER (WHERE o.account_id IS NOT NULL)::int AS pods
       FROM orders o
       JOIN order_lines l ON l.order_id = o.id
       LEFT JOIN accounts a ON a.id = o.account_id
       ${hubspotIndustryJoin()}
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${where}
         AND ${current}
       GROUP BY 1, 2`,
      params,
    ),
  );
  const bySku = new Map<string, { sku: string; revenue: number; pods: number; title: string }>();
  for (const row of rows) {
    const sku = text(row.sku);
    const currentSku = bySku.get(sku) ?? { sku, revenue: 0, pods: 0, title: text(row.title) };
    currentSku.revenue += num(row.revenue);
    currentSku.pods += num(row.pods);
    if (!currentSku.title && text(row.title)) currentSku.title = text(row.title);
    bySku.set(sku, currentSku);
  }
  const skus = [...bySku.values()].sort((a, b) => b.revenue - a.revenue || a.sku.localeCompare(b.sku));
  const families = new Map<ProductFamily, number>(productFamilies.map((family) => [family, 0]));
  for (const sku of skus) {
    const family = productFamily(sku.sku === "No SKU" ? null : sku.sku, sku.title);
    families.set(family, (families.get(family) ?? 0) + sku.revenue);
  }
  return {
    skus: skus.map((sku) => ({ sku: sku.sku, revenue: sku.revenue, pods: sku.pods })),
    families: [...families.entries()].map(([family, revenue]) => ({ family, revenue })),
  };
}

async function industryTotals(sql: Sql, organizationId: string, region: RegionKey, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const where = scope(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const rows = asRows(
    await sql.query(
      `WITH ${hubspotIndustryCte()}
       SELECT
         ${resolvedIndustrySql()} AS industry,
         COUNT(DISTINCT o.account_id)::int AS accounts,
         COALESCE(SUM(o.revenue), 0) AS revenue
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       ${hubspotIndustryJoin()}
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${where}
         AND ${current}
       GROUP BY 1`,
      params,
    ),
  );
  const total = rows.reduce((sum, row) => sum + num(row.revenue), 0);
  return rows
    .map((row) => ({
      type: text(row.industry).trim() || "Needs a type",
      accounts: num(row.accounts),
      revenue: num(row.revenue),
      share: total > 0 ? num(row.revenue) / total : 0,
    }))
    .sort((a, b) => {
      if (a.type === "Needs a type") return 1;
      if (b.type === "Needs a type") return -1;
      return b.revenue - a.revenue;
    });
}

async function activityWindows(sql: Sql, organizationId: string, region: RegionKey, today: string) {
  const params: unknown[] = [
    organizationId,
    REVENUE_ORDER_SOURCE,
    NON_REVENUE_TAG_REGEX,
    addDays(today, -30),
    addDays(today, -60),
    addDays(today, -90),
  ];
  const where = scope(region, params);
  const row = first(
    await sql.query(
      `WITH ${hubspotIndustryCte()}
       SELECT
         COUNT(DISTINCT o.account_id) FILTER (WHERE o.ship_date >= $4::date)::int AS d30,
         COUNT(DISTINCT o.account_id) FILTER (WHERE o.ship_date >= $5::date)::int AS d60,
         COUNT(DISTINCT o.account_id) FILTER (WHERE o.ship_date >= $6::date)::int AS d90
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       ${hubspotIndustryJoin()}
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.ship_date IS NOT NULL
         AND ${where}`,
      params,
    ),
  );
  return { d30: num(row.d30), d60: num(row.d60), d90: num(row.d90) };
}

async function syncTimes(sql: Sql, organizationId: string) {
  const rows = asRows(
    await sql.query(
      `SELECT c.source, MAX(r.finished_at) AS finished_at
       FROM sync_runs r
       JOIN source_connections c ON c.id = r.connection_id
       WHERE c.organization_id = $1
         AND r.status = 'ok'
         AND c.source IN ('shopify', 'hubspot')
       GROUP BY c.source`,
      [organizationId],
    ),
  );
  const shopify = rows.find((row) => text(row.source) === "shopify");
  const hubspot = rows.find((row) => text(row.source) === "hubspot");
  return { shopify: stamp(shopify?.finished_at), hubspot: stamp(hubspot?.finished_at) };
}

function accountRegion(region: RegionKey, params: unknown[]) {
  const states = regionStates(region);
  if (!states) return "";
  const slots = states.map((state) => {
    params.push(state);
    return `$${params.length}`;
  });
  return `AND upper(btrim(a.region)) IN (${slots.join(", ")})`;
}

function between(column: string, from: string | null, to: string | null, params: unknown[]) {
  if (!from || !to) return "TRUE";
  params.push(from, to);
  return `${column} >= $${params.length - 1}::date AND ${column} <= $${params.length}::date`;
}

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function first(value: unknown) {
  return asRows(value)[0] ?? {};
}

function num(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function stamp(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return null;
}
