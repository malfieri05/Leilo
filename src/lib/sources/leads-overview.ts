import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import {
  directOrderPredicate,
  hubspotIndustryCte,
  hubspotIndustryJoin,
  resolvedIndustrySql,
  resolvedIndustryType,
  warehouseAccountSql,
} from "@/lib/sources/direct-model";
import { dsdThroughPredicate } from "@/lib/sources/dsd-model";
import { competitionRanks, isHighVolume, isUpsellSku } from "@/lib/sources/leads-model";
import { NON_REVENUE_TAG_REGEX } from "@/lib/sources/revenue-classification";
import { addDays, regionStates, type RegionKey, type ResolvedPeriod } from "@/lib/sources/sales-overview-model";

export type LeadChannel = "KEHE" | "Direct" | "DSD";

export type LeadAccount = {
  name: string;
  lastShip: string | null;
  revenue: number;
  industry: string;
};

export type LeadCohort = { total: number; rows: LeadAccount[] };

export type UpsellAccount = {
  name: string;
  revenue: number;
  industry: string;
  missing: string[];
  highVolume: boolean;
};

export type LeadsOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      atRisk: Record<LeadChannel, LeadCohort>;
      past: Record<LeadChannel, LeadCohort>;
      upsells: Record<LeadChannel, { total: number; rows: UpsellAccount[] }>;
      competitors: string[];
    };

const CHANNELS: LeadChannel[] = ["KEHE", "Direct", "DSD"];
const COHORT_CAP = 40;
const UPSELL_CAP = 25;

export async function loadLeads(region: RegionKey, period: ResolvedPeriod, today: string): Promise<LeadsOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    await seedCompetitors(sql, organizationId);
    const [channels, competitors] = await Promise.all([
      Promise.all(CHANNELS.map((channel) => loadChannel(sql, organizationId, channel, region, period, today))),
      listCompetitors(sql, organizationId),
    ]);
    const atRisk = {} as Record<LeadChannel, LeadCohort>;
    const past = {} as Record<LeadChannel, LeadCohort>;
    const upsells = {} as Record<LeadChannel, { total: number; rows: UpsellAccount[] }>;
    channels.forEach((channel, index) => {
      const key = CHANNELS[index];
      atRisk[key] = channel.atRisk;
      past[key] = channel.past;
      upsells[key] = channel.upsells;
    });
    return { state: "ready", atRisk, past, upsells, competitors };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

async function loadChannel(
  sql: Sql,
  organizationId: string,
  channel: LeadChannel,
  region: RegionKey,
  period: ResolvedPeriod,
  today: string,
) {
  const [atRisk, past, upsells] = await Promise.all([
    cohort(sql, organizationId, channel, region, period, today, "at-risk"),
    cohort(sql, organizationId, channel, region, period, today, "past"),
    upsell(sql, organizationId, channel, region, period, today),
  ]);
  return { atRisk, past, upsells };
}

async function cohort(
  sql: Sql,
  organizationId: string,
  channel: LeadChannel,
  region: RegionKey,
  period: ResolvedPeriod,
  today: string,
  kind: "at-risk" | "past",
) {
  const countParams: unknown[] = [organizationId];
  const countWhere = channelWhere(channel, region, countParams);
  const countWindow = healthWindow(kind, countParams, today);
  const listParams: unknown[] = [organizationId];
  const listWhere = channelWhere(channel, region, listParams);
  const current = between("o.ship_date", period.from, period.to, listParams);
  const listWindow = healthWindow(kind, listParams, today);
  const [countRow, rows] = await Promise.all([
    first(
      await sql.query(
        `WITH ${hubspotIndustryCte()},
         rolled AS (
           SELECT a.id, MAX(o.ship_date) AS last_ship
           FROM orders o
           JOIN accounts a ON a.id = o.account_id
           ${hubspotIndustryJoin()}
           WHERE o.organization_id = $1
             AND o.ship_date IS NOT NULL
             AND ${countWhere}
           GROUP BY a.id
         )
         SELECT COUNT(*)::int AS total FROM rolled WHERE ${countWindow}`,
        countParams,
      ),
    ),
    asRows(
      await sql.query(
        `WITH ${hubspotIndustryCte()},
         rolled AS (
           SELECT
             a.name,
             MAX(o.ship_date) AS last_ship,
             COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
             ${resolvedIndustrySql()} AS industry
           FROM orders o
           JOIN accounts a ON a.id = o.account_id
           ${hubspotIndustryJoin()}
           WHERE o.organization_id = $1
             AND o.ship_date IS NOT NULL
             AND ${listWhere}
           GROUP BY a.id, a.name, ${resolvedIndustrySql()}
         )
         SELECT name, last_ship::text AS last_ship, revenue, industry
         FROM rolled
         WHERE ${listWindow}
         ORDER BY revenue DESC, name
         LIMIT ${COHORT_CAP}`,
        listParams,
      ),
    ),
  ]);
  return {
    total: num(countRow.total),
    rows: rows.map((row) => ({
      name: text(row.name),
      lastShip: text(row.last_ship) || null,
      revenue: num(row.revenue),
      industry: resolvedIndustryType(text(row.industry), null),
    })),
  };
}

async function upsell(
  sql: Sql,
  organizationId: string,
  channel: LeadChannel,
  region: RegionKey,
  period: ResolvedPeriod,
  today: string,
) {
  const catalogParams: unknown[] = [organizationId];
  const catalogWhere = channelWhere(channel, region, catalogParams);
  const accountParams: unknown[] = [organizationId];
  const accountWhere = channelWhere(channel, region, accountParams);
  const current = between("o.ship_date", period.from, period.to, accountParams);
  const d90 = bind(accountParams, addDays(today, -90));
  const [catalogRows, accountRows] = await Promise.all([
    asRows(
      await sql.query(
        `WITH ${hubspotIndustryCte()}
         SELECT DISTINCT l.sku, COALESCE(l.product_type, '') AS title
         FROM order_lines l
         JOIN orders o ON o.id = l.order_id
         LEFT JOIN accounts a ON a.id = o.account_id
         ${hubspotIndustryJoin()}
         WHERE o.organization_id = $1
           AND l.sku IS NOT NULL
           AND btrim(l.sku) <> ''
           AND ${catalogWhere}`,
        catalogParams,
      ),
    ),
    asRows(
      await sql.query(
        `WITH ${hubspotIndustryCte()},
         active AS (
           SELECT
             a.id,
             a.name,
             COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
             ${resolvedIndustrySql()} AS industry
           FROM orders o
           JOIN accounts a ON a.id = o.account_id
           ${hubspotIndustryJoin()}
           WHERE o.organization_id = $1
             AND o.ship_date IS NOT NULL
             AND ${accountWhere}
           GROUP BY a.id, a.name, ${resolvedIndustrySql()}
           HAVING MAX(o.ship_date) >= ${d90}::date
         ),
         carried AS (
           SELECT o.account_id, l.sku
           FROM orders o
           JOIN order_lines l ON l.order_id = o.id
           LEFT JOIN accounts a ON a.id = o.account_id
           ${hubspotIndustryJoin()}
           WHERE o.organization_id = $1
             AND l.sku IS NOT NULL
             AND btrim(l.sku) <> ''
             AND ${accountWhere}
             AND ${current}
         )
         SELECT active.name, active.revenue, active.industry,
                COALESCE(array_agg(DISTINCT carried.sku) FILTER (WHERE carried.sku IS NOT NULL), '{}') AS skus
         FROM active
         LEFT JOIN carried ON carried.account_id = active.id
         GROUP BY active.id, active.name, active.revenue, active.industry`,
        accountParams,
      ),
    ),
  ]);

  const sellList = [
    ...new Map(
      catalogRows
        .filter((row) => isUpsellSku(text(row.sku), text(row.title)))
        .map((row) => [text(row.sku), text(row.title)] as const),
    ).keys(),
  ];
  const accounts = accountRows.map((row) => ({
    name: text(row.name),
    revenue: num(row.revenue),
    industry: resolvedIndustryType(text(row.industry), null),
    skus: skuSet(row.skus),
  }));
  const highVolume = highVolumeIds(accounts);
  const missing = accounts
    .map((account) => ({
      name: account.name,
      revenue: account.revenue,
      industry: account.industry,
      missing: sellList.filter((sku) => !account.skus.has(sku)).slice(0, 8),
      highVolume: highVolume.has(account.name),
    }))
    .filter((account) => account.missing.length > 0)
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
  return { total: missing.length, rows: missing.slice(0, UPSELL_CAP) };
}

function highVolumeIds(accounts: { name: string; revenue: number; industry: string }[]) {
  const flagged = new Set<string>();
  const byRevenue = [...accounts].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
  competitionRanks(byRevenue.map((account) => account.revenue)).forEach((rank, index) => {
    if (isHighVolume(rank, byRevenue.length)) flagged.add(byRevenue[index].name);
  });
  const groups = new Map<string, typeof accounts>();
  for (const account of accounts) {
    if (account.industry === "Needs a type") continue;
    const group = groups.get(account.industry) ?? [];
    group.push(account);
    groups.set(account.industry, group);
  }
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
    competitionRanks(sorted.map((account) => account.revenue)).forEach((rank, index) => {
      if (isHighVolume(rank, sorted.length)) flagged.add(sorted[index].name);
    });
  }
  return flagged;
}

function healthWindow(kind: "at-risk" | "past", params: unknown[], today: string) {
  const d150 = bind(params, addDays(today, -150));
  if (kind === "past") return `last_ship < ${d150}::date`;
  const d90 = bind(params, addDays(today, -90));
  return `last_ship < ${d90}::date AND last_ship >= ${d150}::date`;
}

function channelWhere(channel: LeadChannel, region: RegionKey, params: unknown[]) {
  const regionSql = accountRegion(region, params);
  if (channel === "KEHE") {
    return `o.source = 'kehe' AND o.direction = 'through' AND o.revenue > 0 ${regionSql}`;
  }
  if (channel === "DSD") return `${dsdThroughPredicate()} ${regionSql}`;
  const tag = bind(params, NON_REVENUE_TAG_REGEX);
  return `o.source = 'shopify' AND ${directOrderPredicate(tag)} ${regionSql} ${warehouseAccountSql(region)}`;
}

const STARTER_COMPETITORS = ["Kaviva", "Melo", "Kava Haven", "Recess"];

async function seedCompetitors(sql: Sql, organizationId: string) {
  const existing = first(
    await sql.query(`SELECT COUNT(*)::int AS total FROM lead_competitors WHERE organization_id = $1`, [organizationId]),
  );
  if (num(existing.total) > 0) return;
  await sql.query(
    `INSERT INTO lead_competitors (organization_id, name)
     SELECT $1, name FROM unnest($2::text[]) AS name
     ON CONFLICT (organization_id, name) DO NOTHING`,
    [organizationId, STARTER_COMPETITORS],
  );
}

async function listCompetitors(sql: Sql, organizationId: string) {
  const rows = asRows(
    await sql.query(
      `SELECT name FROM lead_competitors WHERE organization_id = $1 ORDER BY name`,
      [organizationId],
    ),
  );
  return rows.map((row) => text(row.name));
}

function accountRegion(region: RegionKey, params: unknown[]) {
  const states = regionStates(region);
  if (!states) return "";
  const slots = states.map((state) => bind(params, state));
  return `AND upper(btrim(a.region)) IN (${slots.join(", ")})`;
}

function between(column: string, from: string | null, to: string | null, params: unknown[]) {
  if (!from || !to) return "TRUE";
  const start = bind(params, from);
  const end = bind(params, to);
  return `${column} >= ${start}::date AND ${column} <= ${end}::date`;
}

function bind(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
}

function skuSet(value: unknown) {
  if (Array.isArray(value)) return new Set(value.map((item) => text(item)));
  if (typeof value === "string") {
    const trimmed = value.replace(/^\{|\}$/g, "");
    if (!trimmed) return new Set<string>();
    return new Set(trimmed.split(",").map((item) => item.replace(/^"|"$/g, "")));
  }
  return new Set<string>();
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
