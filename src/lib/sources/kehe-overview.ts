import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import { industryTotals, salesSyncedAt, salesTotals, skuCuts } from "@/lib/sources/distributor-through-queries";
import { fillRate, isKeheUpsellSku } from "@/lib/sources/kehe-model";
import { classifyKeheStockRow, stockIntegrityWarnings, type StockFlag } from "@/lib/sources/kehe-stock-flags";
import { addDays, regionStates, type ProductFamily, type RegionKey, type ResolvedPeriod } from "@/lib/sources/sales-overview-model";

export type KeheName = { id: string; name: string };

export type KeheStockCell = {
  dcCode: string;
  dcName: string;
  upc: string;
  description: string | null;
  flag: StockFlag;
  nearMiss: boolean;
  qtyOnHand: number;
  qtyOnPo: number;
  weeksOnHand: number;
  weeksOnPo: number;
  combinedWeeks: number;
  qtyOnSalesOrder: number;
  note: string | null;
};

export type KeheOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      locations: number;
      revenue: number;
      priorRevenue: number | null;
      skusCarried: number;
      pods: number;
      fillRate: number | null;
      casesOrdered: number;
      casesShipped: number;
      shortShips: { name: string; ordered: number; shipped: number; fill: number }[];
      skus: { sku: string; revenue: number; pods: number }[];
      families: { family: ProductFamily; revenue: number }[];
      industry: { type: string; accounts: number; revenue: number; share: number }[];
      salesSyncedAt: string | null;
      stockSyncedAt: string | null;
      latestShip: string | null;
      stock: KeheStockCell[];
      nearMisses: KeheStockCell[];
      warnings: { code: string; message: string }[];
      newAccounts: KeheName[];
      health: { active: number; atRisk: number; past: number; lifetime: number };
      upsells: { name: string; missing: string[] }[];
    };

export async function loadKeheOverview(
  region: RegionKey,
  period: ResolvedPeriod,
  today: string,
): Promise<KeheOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [sales, cuts, fill, industry, salesSync, stockSync, stock, priorStock, growth] = await Promise.all([
      salesTotals(sql, organizationId, "kehe", region, period),
      skuCuts(sql, organizationId, "kehe", region, period),
      fillTotals(sql, organizationId, region, period),
      industryTotals(sql, organizationId, "kehe", region, period),
      salesSyncedAt(sql, organizationId, "kehe"),
      stockSyncedAt(sql, organizationId),
      latestStock(sql, organizationId, 0),
      latestStock(sql, organizationId, 1),
      growthSlice(sql, organizationId, region, period, today),
    ]);

    const stockView = decorateStock(stock, priorStock);
    return {
      state: "ready",
      locations: sales.locations,
      revenue: sales.revenue,
      priorRevenue: period.compareFrom ? sales.priorRevenue : null,
      skusCarried: sales.skus,
      pods: sales.pods,
      fillRate: fillRate(fill.shipped, fill.ordered),
      casesOrdered: fill.ordered,
      casesShipped: fill.shipped,
      shortShips: fill.shortShips,
      skus: cuts.skus,
      families: cuts.families,
      industry,
      salesSyncedAt: salesSync,
      stockSyncedAt: stockSync,
      latestShip: sales.latestShip,
      stock: stockView.cells,
      nearMisses: stockView.nearMisses,
      warnings: stockView.warnings,
      newAccounts: growth.newAccounts,
      health: growth.health,
      upsells: growth.upsells,
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

async function fillTotals(sql: Sql, organizationId: string, region: RegionKey, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId];
  const regionSql = accountRegion(region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const totals = first(
    await sql.query(
      `SELECT
         COALESCE(SUM(l.cases_ordered), 0) AS ordered,
         COALESCE(SUM(l.cases_shipped), 0) AS shipped
       FROM orders o
       JOIN order_lines l ON l.order_id = o.id
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = 'kehe'
         AND o.direction = 'through'
         AND ${current}
         ${regionSql}`,
      params,
    ),
  );
  const shortParams: unknown[] = [organizationId];
  const shortRegion = accountRegion(region, shortParams);
  const shortCurrent = between("o.ship_date", period.from, period.to, shortParams);
  const shorts = asRows(
    await sql.query(
      `SELECT
         COALESCE(a.name, 'Unassigned') AS name,
         COALESCE(SUM(l.cases_ordered), 0) AS ordered,
         COALESCE(SUM(l.cases_shipped), 0) AS shipped
       FROM orders o
       JOIN order_lines l ON l.order_id = o.id
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = 'kehe'
         AND o.direction = 'through'
         AND ${shortCurrent}
         ${shortRegion}
       GROUP BY 1
       HAVING COALESCE(SUM(l.cases_ordered), 0) > COALESCE(SUM(l.cases_shipped), 0)
       ORDER BY (COALESCE(SUM(l.cases_ordered), 0) - COALESCE(SUM(l.cases_shipped), 0)) DESC
       LIMIT 8`,
      shortParams,
    ),
  );
  return {
    ordered: num(totals.ordered),
    shipped: num(totals.shipped),
    shortShips: shorts.map((row) => {
      const ordered = num(row.ordered);
      const shipped = num(row.shipped);
      return { name: text(row.name), ordered, shipped, fill: ordered > 0 ? shipped / ordered : 0 };
    }),
  };
}

async function stockSyncedAt(sql: Sql, organizationId: string) {
  const row = first(
    await sql.query(
      `SELECT MAX(r.finished_at) AS finished_at
       FROM sync_runs r
       JOIN source_connections c ON c.id = r.connection_id
       WHERE c.organization_id = $1
         AND c.source = 'kehe'
         AND r.status = 'ok'
         AND c.partner = 'stock-status'`,
      [organizationId],
    ),
  );
  return stamp(row.finished_at);
}

async function latestStock(sql: Sql, organizationId: string, offset: number) {
  const runs = asRows(
    await sql.query(
      `SELECT sync_run_id
       FROM kehe_inventory_snapshots
       WHERE organization_id = $1
       GROUP BY sync_run_id
       ORDER BY MAX(captured_at) DESC
       LIMIT 2`,
      [organizationId],
    ),
  );
  const run = runs[offset];
  if (!run?.sync_run_id) return [];
  return asRows(
    await sql.query(
      `SELECT dc_code, dc_name, row_kind, upc, description,
              qty_on_hand, qty_on_po, weeks_on_hand, weeks_on_po, qty_on_sales_order
       FROM kehe_inventory_snapshots
       WHERE organization_id = $1 AND sync_run_id = $2`,
      [organizationId, run.sync_run_id],
    ),
  );
}

function decorateStock(current: Record<string, unknown>[], prior: Record<string, unknown>[]) {
  const toInput = (row: Record<string, unknown>) => ({
    rowKind: text(row.row_kind) === "subtotal" ? ("subtotal" as const) : ("sku" as const),
    dcCode: text(row.dc_code),
    upc: text(row.upc),
    qtyOnHand: num(row.qty_on_hand),
    qtyOnPo: num(row.qty_on_po),
    weeksOnHand: num(row.weeks_on_hand),
    weeksOnPo: num(row.weeks_on_po),
    qtyOnSalesOrder: num(row.qty_on_sales_order),
  });
  const currentInputs = current.map(toInput);
  const priorInputs = prior.map(toInput);
  const warnings = stockIntegrityWarnings({ rows: currentInputs, prior: priorInputs });
  const cells: KeheStockCell[] = [];
  const nearMisses: KeheStockCell[] = [];
  current.forEach((row, index) => {
    const input = currentInputs[index];
    if (input.rowKind !== "sku") return;
    const classified = classifyKeheStockRow(input);
    const cell: KeheStockCell = {
      dcCode: input.dcCode,
      dcName: text(row.dc_name) || input.dcCode,
      upc: input.upc,
      description: text(row.description) || null,
      flag: classified.flag,
      nearMiss: classified.nearMiss,
      qtyOnHand: input.qtyOnHand,
      qtyOnPo: input.qtyOnPo,
      weeksOnHand: input.weeksOnHand,
      weeksOnPo: input.weeksOnPo,
      combinedWeeks: classified.combinedWeeks,
      qtyOnSalesOrder: input.qtyOnSalesOrder,
      note: classified.note,
    };
    if (classified.nearMiss) nearMisses.push(cell);
    if (classified.flag !== "none") cells.push(cell);
  });
  return { cells, nearMisses, warnings };
}

async function growthSlice(
  sql: Sql,
  organizationId: string,
  region: RegionKey,
  period: ResolvedPeriod,
  today: string,
) {
  const d90 = addDays(today, -90);
  const d150 = addDays(today, -150);
  const params: unknown[] = [organizationId, d90, d150];
  const regionSql = accountRegion(region, params);
  const healthRows = first(
    await sql.query(
      `WITH rolled AS (
         SELECT a.id, a.name, MAX(o.ship_date) AS last_ship
         FROM orders o
         JOIN accounts a ON a.id = o.account_id
         WHERE o.organization_id = $1
           AND o.source = 'kehe'
           AND o.direction = 'through'
           AND o.revenue > 0
           AND o.ship_date IS NOT NULL
           ${regionSql}
         GROUP BY a.id, a.name
       )
       SELECT
         COUNT(*)::int AS lifetime,
         COUNT(*) FILTER (WHERE last_ship >= $2::date)::int AS active,
         COUNT(*) FILTER (WHERE last_ship < $2::date AND last_ship >= $3::date)::int AS at_risk,
         COUNT(*) FILTER (WHERE last_ship < $3::date)::int AS past
       FROM rolled`,
      params,
    ),
  );

  const newParams: unknown[] = [organizationId];
  const newRegion = accountRegion(region, newParams);
  let dateSql = "";
  if (period.from && period.to) {
    const from = bind(newParams, period.from);
    const to = bind(newParams, period.to);
    dateSql = `AND first_ship >= ${from}::date AND first_ship <= ${to}::date`;
  }
  const newcomers = asRows(
    await sql.query(
      `WITH firsts AS (
         SELECT a.id::text AS id, a.name, MIN(o.ship_date) AS first_ship
         FROM orders o
         JOIN accounts a ON a.id = o.account_id
         WHERE o.organization_id = $1
           AND o.source = 'kehe'
           AND o.direction = 'through'
           AND o.revenue > 0
           AND o.ship_date IS NOT NULL
           ${newRegion}
         GROUP BY a.id, a.name
       )
       SELECT id, name FROM firsts
       WHERE first_ship IS NOT NULL ${dateSql}
       ORDER BY name
       LIMIT 40`,
      newParams,
    ),
  );

  const catalog = asRows(
    await sql.query(
      `SELECT DISTINCT l.sku, COALESCE(l.product_type, '') AS title
       FROM order_lines l
       JOIN orders o ON o.id = l.order_id
       WHERE o.organization_id = $1
         AND o.source = 'kehe'
         AND o.direction = 'through'
         AND l.sku IS NOT NULL
         AND btrim(l.sku) <> ''`,
      [organizationId],
    ),
  );
  const sellList = catalog
    .filter((row) => isKeheUpsellSku(text(row.sku), text(row.title)))
    .map((row) => text(row.sku));

  const carriedParams: unknown[] = [organizationId, d90];
  const carriedRegion = accountRegion(region, carriedParams);
  let periodSql = "";
  if (period.from && period.to) {
    const from = bind(carriedParams, period.from);
    const to = bind(carriedParams, period.to);
    periodSql = `AND o.ship_date >= ${from}::date AND o.ship_date <= ${to}::date`;
  }
  const carried = asRows(
    await sql.query(
      `WITH active AS (
         SELECT a.id, a.name
         FROM orders o
         JOIN accounts a ON a.id = o.account_id
         WHERE o.organization_id = $1
           AND o.source = 'kehe'
           AND o.direction = 'through'
           AND o.revenue > 0
           AND o.ship_date IS NOT NULL
           ${carriedRegion}
         GROUP BY a.id, a.name
         HAVING MAX(o.ship_date) >= $2::date
       )
       SELECT active.name, l.sku
       FROM active
       LEFT JOIN orders o
         ON o.account_id = active.id
        AND o.organization_id = $1
        AND o.source = 'kehe'
        AND o.direction = 'through'
        AND o.revenue > 0
        ${periodSql}
       LEFT JOIN order_lines l
         ON l.order_id = o.id
        AND l.sku IS NOT NULL
        AND btrim(l.sku) <> ''`,
      carriedParams,
    ),
  );
  const byAccount = new Map<string, Set<string>>();
  for (const row of carried) {
    const name = text(row.name);
    const set = byAccount.get(name) ?? new Set<string>();
    set.add(text(row.sku));
    byAccount.set(name, set);
  }
  const upsells = [...byAccount.entries()]
    .map(([name, skus]) => ({
      name,
      missing: sellList.filter((sku) => !skus.has(sku)).slice(0, 8),
    }))
    .filter((row) => row.missing.length > 0)
    .sort((a, b) => b.missing.length - a.missing.length || a.name.localeCompare(b.name))
    .slice(0, 12);

  return {
    newAccounts: newcomers.map((row) => ({ id: text(row.id), name: text(row.name) })),
    health: {
      lifetime: num(healthRows.lifetime),
      active: num(healthRows.active),
      atRisk: num(healthRows.at_risk),
      past: num(healthRows.past),
    },
    upsells,
  };
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

function bind(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
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
