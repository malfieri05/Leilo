import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import { POS_TAG_REGEX, SAMPLE_TAG_REGEX } from "@/lib/sources/revenue-classification";

export type TrackingRow = {
  reference: string;
  destination: string | null;
  carrier: string | null;
  status: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  relevantUntil: string | null;
};

export type TrackingLane = { rows: TrackingRow[]; total: number };

export type TrackingOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      pos: TrackingLane;
      sample: TrackingLane;
      ltl: TrackingLane;
      shopifySyncedAt: string | null;
      shipstationSyncedAt: string | null;
      sheetsSyncedAt: string | null;
    };

const OPEN = `s.status IS DISTINCT FROM 'voided'
  AND (s.delivered_at IS NULL OR s.relevant_until IS NULL OR s.relevant_until >= CURRENT_DATE)`;

const ORDER = `CASE WHEN delivered_at IS NULL THEN 0 ELSE 1 END, delivered_at DESC NULLS LAST, reference`;

export async function loadTrackingOverview(): Promise<TrackingOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [pos, sample, ltl, syncs] = await Promise.all([
      taggedLane(sql, organizationId, POS_TAG_REGEX, SAMPLE_TAG_REGEX),
      taggedLane(sql, organizationId, SAMPLE_TAG_REGEX, ""),
      ltlLane(sql, organizationId),
      syncTimes(sql, organizationId),
    ]);
    return {
      state: "ready",
      pos,
      sample,
      ltl,
      shopifySyncedAt: syncs.shopify,
      shipstationSyncedAt: syncs.shipstation,
      sheetsSyncedAt: syncs.google_sheets,
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

async function taggedLane(sql: Sql, organizationId: string, include: string, exclude: string): Promise<TrackingLane> {
  const rows = asRows(
    await sql.query(
      `WITH matched AS (
         SELECT
           COALESCE(NULLIF(btrim(o.reference), ''), s.order_external_id, '') AS reference,
           COALESCE(NULLIF(btrim(s.destination), ''), a.name) AS destination,
           s.carrier,
           COALESCE(s.status, 'in_transit') AS status,
           s.tracking_number,
           s.tracking_url,
           s.relevant_until,
           s.delivered_at
         FROM shipments s
         JOIN orders o
           ON o.organization_id = s.organization_id
          AND o.source = 'shopify'
          AND btrim(coalesce(s.order_external_id, '')) <> ''
          AND lower(regexp_replace(btrim(coalesce(o.reference, '')), '^#+', ''))
            = lower(regexp_replace(btrim(s.order_external_id), '^#+', ''))
         LEFT JOIN accounts a ON a.id = o.account_id
         WHERE s.organization_id = $1
           AND s.source = 'shipstation'
           AND ${OPEN}
           AND o.tags ~* $2
           AND ($3 = '' OR NOT (o.tags ~* $3))
       )
       SELECT reference, destination, carrier, status, tracking_number, tracking_url, relevant_until,
              COUNT(*) OVER ()::int AS total
       FROM matched
       ORDER BY ${ORDER}
       LIMIT 50`,
      [organizationId, include, exclude],
    ),
  );
  return lane(rows);
}

async function ltlLane(sql: Sql, organizationId: string): Promise<TrackingLane> {
  const rows = asRows(
    await sql.query(
      `WITH matched AS (
         SELECT
           COALESCE(s.order_external_id, '') AS reference,
           s.destination,
           s.carrier,
           COALESCE(s.status, 'in_transit') AS status,
           s.tracking_number,
           s.tracking_url,
           s.relevant_until,
           s.delivered_at
         FROM shipments s
         WHERE s.organization_id = $1
           AND s.source = 'google_sheets'
           AND ${OPEN}
       )
       SELECT reference, destination, carrier, status, tracking_number, tracking_url, relevant_until,
              COUNT(*) OVER ()::int AS total
       FROM matched
       ORDER BY ${ORDER}
       LIMIT 50`,
      [organizationId],
    ),
  );
  return lane(rows);
}

async function syncTimes(sql: Sql, organizationId: string) {
  const rows = asRows(
    await sql.query(
      `SELECT c.source, MAX(r.finished_at) AS finished_at
       FROM sync_runs r
       JOIN source_connections c ON c.id = r.connection_id
       WHERE c.organization_id = $1
         AND r.status = 'ok'
         AND c.source IN ('shopify', 'shipstation', 'google_sheets')
       GROUP BY c.source`,
      [organizationId],
    ),
  );
  const stampFor = (source: string) => stamp(rows.find((row) => text(row.source) === source)?.finished_at);
  return {
    shopify: stampFor("shopify"),
    shipstation: stampFor("shipstation"),
    google_sheets: stampFor("google_sheets"),
  };
}

function lane(rows: Record<string, unknown>[]): TrackingLane {
  return {
    total: rows.length === 0 ? 0 : num(rows[0]?.total),
    rows: rows.map((row) => ({
      reference: text(row.reference) || "—",
      destination: text(row.destination) || null,
      carrier: text(row.carrier) || null,
      status: text(row.status) || "in_transit",
      trackingNumber: text(row.tracking_number) || null,
      trackingUrl: text(row.tracking_url) || null,
      relevantUntil: dateOnly(row.relevant_until),
    })),
  };
}

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
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
