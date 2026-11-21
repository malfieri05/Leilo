import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import { regionLabel, type RegionKey } from "@/lib/sources/sales-overview-model";
import {
  geographyTokens,
  isLeiloBrand,
  matchesCompetitorSet,
  normalizeBrandName,
  SPINS_COMPETITOR_BRANDS,
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  spinsPartnerSlug,
  type SpinsPeriodWeeks,
  type SpinsQuery,
  type SpinsReportKind,
  type SpinsScope,
} from "@/lib/sources/spins-model";

export type SpinsTableRow = {
  brand: string | null;
  itemLabel: string | null;
  upc: string | null;
  retailer: string | null;
  geography: string | null;
  dollars: number;
  units: number;
  rank: number | null;
  dollarsPct: number | null;
  unitsPct: number | null;
};

export type SpinsComparisonRow = {
  brand: string;
  dollars: number;
  units: number;
  rank: number | null;
  leilo: boolean;
};

export type SpinsOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      release: { syncedAt: string | null; rowCount: number } | null;
      coverage: Record<string, boolean>;
      summary: {
        inViewDollars: number;
        inViewUnits: number;
        leiloDollars: number;
        competitorDollars: number;
        heldOut: number;
      };
      rows: SpinsTableRow[];
      comparison: SpinsComparisonRow[];
      regionNote: string | null;
    };

export function coverageKey(report: SpinsReportKind, weeks: SpinsPeriodWeeks) {
  return `${report}:${weeks}`;
}

export async function loadSpins(query: SpinsQuery): Promise<SpinsOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [coverage, release] = await Promise.all([
      loadCoverage(sql, organizationId),
      loadRelease(sql, organizationId, spinsPartnerSlug(query.report, query.weeks)),
    ]);
    if (!release) {
      return {
        state: "ready",
        release: null,
        coverage,
        summary: emptySummary(),
        rows: [],
        comparison: [],
        regionNote: query.region === "nationwide" ? null : `No ${label(query)} file is loaded, so ${regionLabel(query.region)} has nothing to filter.`,
      };
    }
    const [summaryBits, grouped, rows] = await Promise.all([
      loadSummary(sql, organizationId, release.id, query.region),
      loadGrouped(sql, organizationId, release.id, query.region),
      loadRows(sql, organizationId, release.id, query),
    ]);
    let leiloDollars = 0;
    let competitorDollars = 0;
    for (const row of grouped.values()) {
      if (isLeiloBrand(row.brand)) leiloDollars += row.dollars;
      if (matchesCompetitorSet(row.brand)) competitorDollars += row.dollars;
    }
    return {
      state: "ready",
      release: { syncedAt: release.syncedAt, rowCount: release.rowCount },
      coverage,
      summary: {
        inViewDollars: summaryBits.inViewDollars,
        inViewUnits: summaryBits.inViewUnits,
        leiloDollars,
        competitorDollars,
        heldOut: summaryBits.heldOut,
      },
      rows,
      comparison: comparisonFrom(grouped),
      regionNote: regionNote(query.region, summaryBits.withGeo, summaryBits.blankGeo),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

async function loadCoverage(sql: Sql, organizationId: string) {
  const coverage: Record<string, boolean> = {};
  for (const report of SPINS_REPORT_KINDS) {
    for (const weeks of SPINS_PERIOD_WEEKS) coverage[coverageKey(report, weeks)] = false;
  }
  const rows = asRows(
    await sql.query(
      `SELECT report_kind, period_weeks, COUNT(*) FILTER (WHERE included)::int AS visible
       FROM spins_rows
       WHERE organization_id = $1
       GROUP BY report_kind, period_weeks`,
      [organizationId],
    ),
  );
  for (const row of rows) {
    const report = text(row.report_kind);
    const weeks = num(row.period_weeks);
    if (!isReport(report) || !isWeeks(weeks)) continue;
    coverage[coverageKey(report, weeks)] = num(row.visible) > 0;
  }
  return coverage;
}

async function loadRelease(sql: Sql, organizationId: string, partner: string) {
  const row = first(
    await sql.query(
      `SELECT s.id, s.finished_at, s.row_count
       FROM sync_runs s
       JOIN source_connections c ON c.id = s.connection_id
       WHERE c.organization_id = $1
         AND c.source = 'spins'
         AND c.partner = $2
         AND s.status = 'ok'
       ORDER BY s.started_at DESC
       LIMIT 1`,
      [organizationId, partner],
    ),
  );
  if (!row.id) return null;
  return {
    id: text(row.id),
    syncedAt: row.finished_at ? text(row.finished_at) : null,
    rowCount: num(row.row_count),
  };
}

async function loadSummary(sql: Sql, organizationId: string, syncRunId: string, region: RegionKey) {
  const params: unknown[] = [organizationId, syncRunId];
  const geo = geoSql(region, params);
  const row = first(
    await sql.query(
      `SELECT
         COALESCE(SUM(dollars) FILTER (WHERE included), 0) AS in_view_dollars,
         COALESCE(SUM(units) FILTER (WHERE included), 0) AS in_view_units,
         COUNT(*) FILTER (WHERE NOT included)::int AS held_out,
         COUNT(*) FILTER (WHERE NULLIF(btrim(COALESCE(geography, '')), '') IS NOT NULL)::int AS with_geo,
         COUNT(*) FILTER (WHERE NULLIF(btrim(COALESCE(geography, '')), '') IS NULL)::int AS blank_geo
       FROM spins_rows
       WHERE organization_id = $1
         AND sync_run_id = $2
         ${geo}`,
      params,
    ),
  );
  return {
    inViewDollars: num(row.in_view_dollars),
    inViewUnits: num(row.in_view_units),
    heldOut: num(row.held_out),
    withGeo: num(row.with_geo),
    blankGeo: num(row.blank_geo),
  };
}

async function loadGrouped(sql: Sql, organizationId: string, syncRunId: string, region: RegionKey) {
  const params: unknown[] = [organizationId, syncRunId];
  const geo = geoSql(region, params);
  const rows = asRows(
    await sql.query(
      `SELECT COALESCE(brand, '') AS brand,
              COALESCE(SUM(dollars), 0) AS dollars,
              COALESCE(SUM(units), 0) AS units,
              MIN(rank) AS rank
       FROM spins_rows
       WHERE organization_id = $1
         AND sync_run_id = $2
         AND included = true
         ${geo}
       GROUP BY brand`,
      params,
    ),
  );
  const grouped = new Map<string, { brand: string; dollars: number; units: number; rank: number | null }>();
  for (const row of rows) {
    grouped.set(text(row.brand), {
      brand: text(row.brand),
      dollars: num(row.dollars),
      units: num(row.units),
      rank: row.rank == null ? null : num(row.rank),
    });
  }
  return grouped;
}

async function loadRows(sql: Sql, organizationId: string, syncRunId: string, query: SpinsQuery) {
  const params: unknown[] = [organizationId, syncRunId];
  const geo = geoSql(query.region, params);
  const scope = scopeSql(query.scope, params);
  const rows = asRows(
    await sql.query(
      `SELECT brand, item_label, upc, retailer, geography, dollars, units, rank, dollars_pct_chg, units_pct_chg
       FROM spins_rows
       WHERE organization_id = $1
         AND sync_run_id = $2
         AND included = true
         ${geo}
         ${scope}
       ORDER BY dollars DESC NULLS LAST, brand
       LIMIT 50`,
      params,
    ),
  );
  return rows.map((row) => ({
    brand: text(row.brand) || null,
    itemLabel: text(row.item_label) || null,
    upc: text(row.upc) || null,
    retailer: text(row.retailer) || null,
    geography: text(row.geography) || null,
    dollars: num(row.dollars),
    units: num(row.units),
    rank: row.rank == null ? null : num(row.rank),
    dollarsPct: row.dollars_pct_chg == null ? null : num(row.dollars_pct_chg),
    unitsPct: row.units_pct_chg == null ? null : num(row.units_pct_chg),
  }));
}

function comparisonFrom(grouped: Map<string, { brand: string; dollars: number; units: number; rank: number | null }>) {
  const rows: SpinsComparisonRow[] = [];
  const leilo = [...grouped.values()].filter((row) => isLeiloBrand(row.brand));
  if (leilo.length > 0) {
    rows.push({
      brand: "Leilo",
      dollars: leilo.reduce((sum, row) => sum + row.dollars, 0),
      units: leilo.reduce((sum, row) => sum + row.units, 0),
      rank: leilo.reduce<number | null>((best, row) => (row.rank == null ? best : best == null ? row.rank : Math.min(best, row.rank)), null),
      leilo: true,
    });
  }
  for (const brand of SPINS_COMPETITOR_BRANDS) {
    const match = [...grouped.values()].find((row) => normalizeBrandName(row.brand) === normalizeBrandName(brand));
    rows.push({
      brand,
      dollars: match?.dollars ?? 0,
      units: match?.units ?? 0,
      rank: match?.rank ?? null,
      leilo: false,
    });
  }
  return rows;
}

function regionNote(region: RegionKey, withGeo: number, blankGeo: number) {
  if (region === "nationwide") return null;
  if (withGeo === 0) return "This file has no geography, so the region filter is not changing the list.";
  if (blankGeo > 0) return "Rows without a geography stay in this view.";
  return null;
}

function geoSql(region: RegionKey, params: unknown[]) {
  const tokens = geographyTokens(region);
  if (!tokens) return "";
  const slots = tokens.map((token) => bind(params, token));
  return `AND (
    NULLIF(btrim(COALESCE(geography, '')), '') IS NULL
    OR upper(btrim(geography)) IN (${slots.join(", ")})
  )`;
}

function scopeSql(scope: SpinsScope, params: unknown[]) {
  if (scope === "all") return "";
  const slots = SPINS_COMPETITOR_BRANDS.map((brand) => bind(params, normalizeBrandName(brand)));
  return `AND (
    lower(btrim(COALESCE(brand, ''))) LIKE 'leilo%'
    OR lower(regexp_replace(btrim(COALESCE(brand, '')), '[''’]', '', 'g')) IN (${slots.join(", ")})
  )`;
}

function emptySummary() {
  return { inViewDollars: 0, inViewUnits: 0, leiloDollars: 0, competitorDollars: 0, heldOut: 0 };
}

function label(query: SpinsQuery) {
  return `${query.report} ${query.weeks}-week`;
}

function bind(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
}

function isReport(value: string): value is SpinsReportKind {
  return SPINS_REPORT_KINDS.includes(value as SpinsReportKind);
}

function isWeeks(value: number): value is SpinsPeriodWeeks {
  return SPINS_PERIOD_WEEKS.includes(value as SpinsPeriodWeeks);
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
