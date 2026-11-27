import type { Sql } from "@/lib/db";
import { dsdThroughPredicate } from "@/lib/sources/dsd-model";
import { salesTotals as keheUnfiThroughTotals } from "@/lib/sources/distributor-through-queries";
import { NON_REVENUE_TAG_REGEX } from "@/lib/sources/revenue-classification";
import { REVENUE_ORDER_SOURCE } from "@/lib/sources/revenue";
import type { RegionKey, ResolvedPeriod } from "@/lib/sources/sales-overview-model";

export type DistributorChannel = "KEHE" | "UNFI" | "DSD";

export type DistributorFlowRow = {
  channel: DistributorChannel;
  salesTo: {
    revenue: number;
    orders: number;
    priorRevenue: number | null;
  };
  salesThrough: {
    revenue: number;
    retailers: number;
    priorRevenue: number | null;
  };
};

const CHANNELS: DistributorChannel[] = ["KEHE", "DSD", "UNFI"];

export async function distributorFlowForChannel(
  sql: Sql,
  organizationId: string,
  channel: DistributorChannel,
  region: RegionKey,
  period: ResolvedPeriod,
): Promise<DistributorFlowRow> {
  const rows = await distributorToThroughRows(sql, organizationId, region, period);
  return rows.find((row) => row.channel === channel) ?? emptyFlow(channel, period);
}

function emptyFlow(channel: DistributorChannel, period: ResolvedPeriod): DistributorFlowRow {
  return {
    channel,
    salesTo: { revenue: 0, orders: 0, priorRevenue: period.compareFrom ? 0 : null },
    salesThrough: { revenue: 0, retailers: 0, priorRevenue: period.compareFrom ? 0 : null },
  };
}

/** Leilo invoice to the distributor (Shopify) vs distributor sales to stores (imports). */
export async function distributorToThroughRows(
  sql: Sql,
  organizationId: string,
  region: RegionKey,
  period: ResolvedPeriod,
): Promise<DistributorFlowRow[]> {
  const [toByMethod, keheThrough, unfiThrough, dsdThrough] = await Promise.all([
    salesToTotals(sql, organizationId, region, period),
    keheUnfiThroughTotals(sql, organizationId, "kehe", region, period),
    keheUnfiThroughTotals(sql, organizationId, "unfi", region, period),
    dsdThroughTotals(sql, organizationId, region, period),
  ]);

  const toMap = new Map(toByMethod.map((row) => [row.method, row]));
  const throughByChannel: Record<DistributorChannel, { revenue: number; retailers: number; priorRevenue: number | null }> =
    {
      KEHE: sliceThrough(keheThrough, period),
      UNFI: sliceThrough(unfiThrough, period),
      DSD: sliceThrough(dsdThrough, period),
    };

  return CHANNELS.map((channel) => {
    const to = toMap.get(channel) ?? { revenue: 0, orders: 0, priorRevenue: period.compareFrom ? 0 : null };
    return {
      channel,
      salesTo: {
        revenue: to.revenue,
        orders: to.orders,
        priorRevenue: to.priorRevenue,
      },
      salesThrough: throughByChannel[channel],
    };
  });
}

function sliceThrough(
  totals: { revenue: number; priorRevenue: number; locations: number },
  period: ResolvedPeriod,
) {
  return {
    revenue: totals.revenue,
    retailers: totals.locations,
    priorRevenue: period.compareFrom ? totals.priorRevenue : null,
  };
}

type ToRow = { method: DistributorChannel; revenue: number; orders: number; priorRevenue: number | null };

async function salesToTotals(sql: Sql, organizationId: string, region: RegionKey, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const regionSql = revenueRegion(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const prior = between("o.ship_date", period.compareFrom, period.compareTo, params);
  const rows = asRows(
    await sql.query(
      `SELECT
         o.ordering_method AS method,
         COUNT(*) FILTER (WHERE ${current})::int AS orders,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${prior}), 0) AS prior_revenue
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.revenue > 0
         AND NOT (o.tags ~* $3)
         AND o.ordering_method IN ('KEHE', 'UNFI', 'DSD')
         AND o.direction = 'to'
         ${regionSql}
       GROUP BY o.ordering_method`,
      params,
    ),
  );
  return rows.map((row) => ({
    method: text(row.method) as DistributorChannel,
    revenue: num(row.revenue),
    orders: num(row.orders),
    priorRevenue: period.compareFrom ? num(row.prior_revenue) : null,
  })) as ToRow[];
}

async function dsdThroughTotals(sql: Sql, organizationId: string, region: RegionKey, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId];
  const regionSql = accountRegion(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const prior = between("o.ship_date", period.compareFrom, period.compareTo, params);
  const row = first(
    await sql.query(
      `SELECT
         COUNT(DISTINCT o.account_id) FILTER (WHERE ${current})::int AS locations,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${prior}), 0) AS prior_revenue
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND ${dsdThroughPredicate()}
         ${regionSql}`,
      params,
    ),
  );
  return {
    locations: num(row.locations),
    revenue: num(row.revenue),
    priorRevenue: num(row.prior_revenue),
  };
}

function revenueRegion(region: RegionKey, params: unknown[]) {
  const states = stateSlots(region, params);
  if (!states) return "";
  return `AND o.ordering_method = 'Direct'
    AND o.direction = 'direct'
    AND o.exclude_from_direct = false
    AND upper(btrim(a.region)) IN (${states})`;
}

function accountRegion(region: RegionKey, params: unknown[]) {
  const states = stateSlots(region, params);
  if (!states) return "";
  return `AND upper(btrim(a.region)) IN (${states})`;
}

function stateSlots(region: RegionKey, params: unknown[]) {
  if (region === "nationwide") return "";
  const states = region === "california" ? ["CA"] : ["FL", "GA", "SC", "NC", "MS", "TN", "AL"];
  return states
    .map((state) => {
      params.push(state);
      return `$${params.length}`;
    })
    .join(", ");
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