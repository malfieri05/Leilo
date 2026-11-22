import type { Sql } from "@/lib/db";
import { industryBucket } from "@/lib/sources/kehe-model";
import {
  productFamily,
  regionStates,
  type ProductFamily,
  type RegionKey,
  type ResolvedPeriod,
} from "@/lib/sources/sales-overview-model";

export type ThroughSource = "kehe" | "unfi";

export type ThroughSalesTotals = {
  locations: number;
  revenue: number;
  priorRevenue: number;
  skus: number;
  pods: number;
  latestShip: string | null;
};

export type ThroughSkuRow = { sku: string; revenue: number; pods: number };

export type ThroughSkuCuts = {
  skus: ThroughSkuRow[];
  families: { family: ProductFamily; revenue: number }[];
};

export type ThroughIndustryRow = { type: string; accounts: number; revenue: number; share: number };

export async function salesTotals(
  sql: Sql,
  organizationId: string,
  source: ThroughSource,
  region: RegionKey,
  period: ResolvedPeriod,
): Promise<ThroughSalesTotals> {
  const params: unknown[] = [organizationId, source];
  const regionSql = accountRegion(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const prior = between("o.ship_date", period.compareFrom, period.compareTo, params);
  const money = first(
    await sql.query(
      `SELECT
         COUNT(DISTINCT o.account_id) FILTER (WHERE ${current})::int AS locations,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${prior}), 0) AS prior_revenue,
         (SELECT MAX(ship_date) FROM orders
           WHERE organization_id = $1 AND source = $2 AND direction = 'through') AS latest_ship
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.direction = 'through'
         AND o.revenue > 0
         ${regionSql}`,
      params,
    ),
  );
  const cutParams: unknown[] = [organizationId, source];
  const cutRegion = accountRegion(region, cutParams);
  const cutCurrent = between("o.ship_date", period.from, period.to, cutParams);
  const cuts = first(
    await sql.query(
      `SELECT
         COUNT(DISTINCT l.sku) FILTER (WHERE l.sku IS NOT NULL AND btrim(l.sku) <> '')::int AS skus,
         COUNT(DISTINCT (o.account_id::text || '|' || l.sku)) FILTER (
           WHERE o.account_id IS NOT NULL AND l.sku IS NOT NULL AND btrim(l.sku) <> ''
         )::int AS pods
       FROM orders o
       JOIN order_lines l ON l.order_id = o.id
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.direction = 'through'
         AND o.revenue > 0
         AND ${cutCurrent}
         ${cutRegion}`,
      cutParams,
    ),
  );
  return {
    locations: num(money.locations),
    revenue: num(money.revenue),
    priorRevenue: num(money.prior_revenue),
    skus: num(cuts.skus),
    pods: num(cuts.pods),
    latestShip: dateOnly(money.latest_ship),
  };
}

export async function skuCuts(
  sql: Sql,
  organizationId: string,
  source: ThroughSource,
  region: RegionKey,
  period: ResolvedPeriod,
): Promise<ThroughSkuCuts> {
  const params: unknown[] = [organizationId, source];
  const regionSql = accountRegion(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const rows = asRows(
    await sql.query(
      `SELECT
         COALESCE(NULLIF(btrim(l.sku), ''), 'No SKU') AS sku,
         COALESCE(l.product_type, '') AS title,
         SUM(COALESCE(l.revenue, o.revenue, 0)) AS revenue,
         COUNT(DISTINCT o.account_id) FILTER (WHERE o.account_id IS NOT NULL)::int AS pods
       FROM orders o
       JOIN order_lines l ON l.order_id = o.id
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.direction = 'through'
         AND o.revenue > 0
         AND ${current}
         ${regionSql}
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
  const families = new Map<ProductFamily, number>([
    ["RTDs/Cans", 0],
    ["Kava Extract", 0],
    ["Kava Flakes", 0],
    ["Kava Powders", 0],
    ["Unmapped", 0],
  ]);
  for (const sku of skus) {
    const family = productFamily(sku.sku === "No SKU" ? null : sku.sku, sku.title);
    families.set(family, (families.get(family) ?? 0) + sku.revenue);
  }
  return {
    skus: skus.map((sku) => ({ sku: sku.sku, revenue: sku.revenue, pods: sku.pods })),
    families: [...families.entries()].map(([family, revenue]) => ({ family, revenue })),
  };
}

export async function industryTotals(
  sql: Sql,
  organizationId: string,
  source: ThroughSource,
  region: RegionKey,
  period: ResolvedPeriod,
): Promise<ThroughIndustryRow[]> {
  const params: unknown[] = [organizationId, source];
  const regionSql = accountRegion(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const rows = asRows(
    await sql.query(
      `SELECT
         COALESCE(NULLIF(btrim(COALESCE(a.industry_type, h.industry_type)), ''), '') AS industry,
         COUNT(DISTINCT o.account_id)::int AS accounts,
         COALESCE(SUM(o.revenue), 0) AS revenue
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       LEFT JOIN accounts h
         ON h.organization_id = a.organization_id
        AND h.source = 'hubspot'
        AND lower(btrim(h.name)) = lower(btrim(a.name))
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.direction = 'through'
         AND o.revenue > 0
         AND ${current}
         ${regionSql}
       GROUP BY 1`,
      params,
    ),
  );
  const total = rows.reduce((sum, row) => sum + num(row.revenue), 0);
  return rows
    .map((row) => ({
      type: industryBucket(text(row.industry)),
      accounts: num(row.accounts),
      revenue: num(row.revenue),
      share: total > 0 ? num(row.revenue) / total : 0,
    }))
    .sort((a, b) => {
      if (a.type === "Needs a type") return -1;
      if (b.type === "Needs a type") return 1;
      return b.revenue - a.revenue;
    });
}

export async function salesSyncedAt(sql: Sql, organizationId: string, source: ThroughSource) {
  const row = first(
    await sql.query(
      `SELECT MAX(r.finished_at) AS finished_at
       FROM sync_runs r
       JOIN source_connections c ON c.id = r.connection_id
       WHERE c.organization_id = $1
         AND c.source = $2
         AND r.status = 'ok'
         AND c.partner = 'sales-through'`,
      [organizationId, source],
    ),
  );
  return stamp(row.finished_at);
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

function dateOnly(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value) return value.slice(0, 10);
  return null;
}

function stamp(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return null;
}
