import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import { sourceCatalog, sourceConfigured, specFor } from "@/lib/sources/catalog";
import { pullGoogleSheets } from "@/lib/sources/connectors/google-sheets";
import { pullHubSpot } from "@/lib/sources/connectors/hubspot";
import { pullShipStation } from "@/lib/sources/connectors/shipstation";
import { pullShopify } from "@/lib/sources/connectors/shopify";
import { pullSpins } from "@/lib/sources/connectors/spins";
import { draftsFromFile, parseDelimited } from "@/lib/sources/files";
import { normalizePartnerName } from "@/lib/sources/dsd/partners";
import { parseKeheSalesFile } from "@/lib/sources/kehe/parse-sales-through";
import { parseKeheStockStatus } from "@/lib/sources/kehe/parse-stock-status";
import { persistBundle } from "@/lib/sources/persist";
import { parseSpinsExport } from "@/lib/sources/spins/parse-export";
import {
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  spinsPartnerSlug,
  type SpinsPeriodWeeks,
  type SpinsReportKind,
} from "@/lib/sources/spins-model";
import type { PullResult, SyncState } from "@/lib/sources/types";

const pullers: Record<string, () => Promise<PullResult>> = {
  shopify: pullShopify,
  hubspot: pullHubSpot,
  shipstation: pullShipStation,
  google_sheets: pullGoogleSheets,
  spins: pullSpins,
};

export async function runConnector(source: string): Promise<SyncState> {
  const spec = specFor(source);
  if (!spec || spec.kind === "file") {
    return { ok: false, message: "That source takes a file, not an API sync." };
  }
  if (!hasDatabase()) return { ok: false, message: "DATABASE_URL is not set." };
  if (!sourceConfigured(spec)) {
    return { ok: false, message: `Set ${spec.env.join(", ")} before syncing ${spec.name}.` };
  }
  const pull = pullers[source];
  if (!pull) return { ok: false, message: "That source has no connector." };
  return execute(source, "", spec.method, pull);
}

export async function runConfiguredSources(): Promise<SyncState> {
  const ready = sourceCatalog.filter((spec) => spec.kind !== "file" && sourceConfigured(spec));
  if (ready.length === 0) {
    return { ok: false, message: "No API source has credentials yet." };
  }
  const messages: string[] = [];
  let ok = true;
  for (const spec of ready) {
    const result = await runConnector(spec.source);
    ok = ok && Boolean(result?.ok);
    messages.push(`${spec.name}: ${result?.message ?? "No result."}`);
  }
  return { ok, message: messages.join(" ") };
}

export async function importSourceFile(input: {
  source: string;
  partner: string;
  filename: string;
  text: string;
  reportKind?: string;
  periodWeeks?: string;
}): Promise<SyncState> {
  const spec = specFor(input.source);
  if (!spec || spec.kind === "api") {
    return { ok: false, message: "Choose a file source." };
  }
  if ((input.source === "dsd" || input.source === "encompass") && !input.partner) {
    return { ok: false, message: "Name the partner for a DSD or Encompass file." };
  }
  if (!hasDatabase()) return { ok: false, message: "DATABASE_URL is not set." };

  let rows: Record<string, string>[];
  try {
    rows = parseDelimited(input.filename, input.text);
  } catch (error) {
    return { ok: false, message: publicError(error) };
  }
  if (rows.length === 0) {
    return { ok: false, message: "That file has no data rows." };
  }

  const rawPartner = input.partner.trim().slice(0, 80);
  const partner =
    input.source === "dsd" || input.source === "encompass" ? normalizePartnerName(rawPartner).slice(0, 80) : rawPartner;
  if ((input.source === "dsd" || input.source === "encompass") && !partner) {
    return { ok: false, message: "Name the partner for a DSD or Encompass file." };
  }
  if (input.source === "spins") {
    const reportKind = asReportKind(input.reportKind ?? "");
    const periodWeeks = asPeriodWeeks(input.periodWeeks ?? "");
    if (!reportKind || !periodWeeks) {
      return { ok: false, message: "Choose a SPINS report type and a 4-, 12-, 24-, or 52-week period." };
    }
    return execute(input.source, spinsPartnerSlug(reportKind, periodWeeks), spec.method, async () =>
      parseSpinsExport(rows, reportKind, periodWeeks),
    );
  }
  if (input.source === "kehe") {
    const kind = input.reportKind === "stock-status" ? "stock-status" : "sales-through";
    if (!input.reportKind) {
      return { ok: false, message: "Choose a KEHE report type before importing." };
    }
    return execute(input.source, kind, spec.method, async () =>
      kind === "stock-status" ? parseKeheStockStatus(input.text) : parseKeheSalesFile(input.text),
    );
  }
  return execute(input.source, partner, spec.method, async () => draftsFromFile(input.source, partner, rows));
}

function asReportKind(value: string): SpinsReportKind | null {
  return SPINS_REPORT_KINDS.includes(value as SpinsReportKind) ? (value as SpinsReportKind) : null;
}

function asPeriodWeeks(value: string): SpinsPeriodWeeks | null {
  const weeks = Number(value);
  return SPINS_PERIOD_WEEKS.includes(weeks as SpinsPeriodWeeks) ? (weeks as SpinsPeriodWeeks) : null;
}

async function execute(
  source: string,
  partner: string,
  method: string,
  pull: () => Promise<PullResult>,
): Promise<SyncState> {
  const sql = getSql();
  if (!sql) return { ok: false, message: "DATABASE_URL is not set." };
  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const connectionId = await upsertConnection(sql, organizationId, source, partner, method);
    const syncRunId = await startRun(sql, connectionId);
    try {
      const pulled = await pull();
      if (!pulled.skipped) {
        await persistBundle(sql, { organizationId, source, partner, syncRunId, bundle: pulled });
      }
      const status = pulled.skipped ? "skipped" : "ok";
      await finishRun(sql, syncRunId, status, pulled.rowCount, pulled.message);
      return { ok: true, message: pulled.message };
    } catch (error) {
      const message = publicError(error);
      await finishRun(sql, syncRunId, "error", 0, message);
      return { ok: false, message };
    }
  } catch (error) {
    return { ok: false, message: publicError(error) };
  }
}

async function upsertConnection(
  sql: Sql,
  organizationId: string,
  source: string,
  partner: string,
  method: string,
) {
  const rows = await sql`
    INSERT INTO source_connections (organization_id, source, partner, method)
    VALUES (${organizationId}, ${source}, ${partner}, ${method})
    ON CONFLICT (organization_id, source, partner)
    DO UPDATE SET method = EXCLUDED.method
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (typeof id !== "string") throw new Error("The source connection could not be saved.");
  return id;
}

async function startRun(sql: Sql, connectionId: string) {
  const rows = await sql`
    INSERT INTO sync_runs (connection_id, status)
    VALUES (${connectionId}, 'running')
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (typeof id !== "string") throw new Error("The sync run could not be opened.");
  return id;
}

async function finishRun(sql: Sql, syncRunId: string, status: string, rowCount: number, message: string) {
  await sql`
    UPDATE sync_runs
    SET status = ${status},
        row_count = ${rowCount},
        message = ${message},
        finished_at = now()
    WHERE id = ${syncRunId}
  `;
}
