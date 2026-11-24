import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import { canApiSync } from "@/lib/sources/api-pullers";
import { sourceCatalog, sourceConfigured, specFor } from "@/lib/sources/catalog";
import { pullGoogleSheets } from "@/lib/sources/connectors/google-sheets";
import {
  keheSalesSheetConfigured,
  keheStockSheetConfigured,
  pullKeheSalesFromGoogleSheet,
  pullKeheStockFromGoogleSheet,
} from "@/lib/sources/connectors/kehe-google-sheets";
import { pullHubSpot } from "@/lib/sources/connectors/hubspot";
import { pullShipStation } from "@/lib/sources/connectors/shipstation";
import { pullShopify } from "@/lib/sources/connectors/shopify";
import { pullZoomInfo } from "@/lib/sources/connectors/zoominfo";
import { pullSpins } from "@/lib/sources/connectors/spins";
import { missingSpinsDriveSlots, planSpinsDriveJobs, pullSpinsDriveFile } from "@/lib/sources/connectors/spins-drive";
import { spinsDriveLive } from "@/lib/sources/spins/spins-connection";
import { draftsFromFile, parseDelimited } from "@/lib/sources/files";
import { dsdDriveLive } from "@/lib/sources/dsd/dsd-connection";
import { DSD_PARTNERS, normalizePartnerName } from "@/lib/sources/dsd/partners";
import { planDsdDriveJobs, pullDsdDriveFile } from "@/lib/sources/connectors/dsd-drive";
import { parseKeheSalesFile } from "@/lib/sources/kehe/parse-sales-through";
import { parseKeheStockStatus } from "@/lib/sources/kehe/parse-stock-status";
import { persistBundle } from "@/lib/sources/persist";
import { parsePromoCalendar, promoPartnerSlug } from "@/lib/sources/promo/parse-calendar";
import { parseSkuPricelist, skuPartnerSlug } from "@/lib/sources/sku/parse-pricelist";
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
  zoominfo: pullZoomInfo,
  shipstation: pullShipStation,
  google_sheets: pullGoogleSheets,
  spins: pullSpins,
};

export async function runConnector(source: string): Promise<SyncState> {
  const spec = specFor(source);
  if (!spec || (spec.kind === "file" && !(source === "dsd" && dsdDriveLive()))) {
    return { ok: false, message: "That source takes a file, not an API sync." };
  }
  if (!hasDatabase()) return { ok: false, message: "DATABASE_URL is not set." };
  if (!sourceConfigured(spec)) {
    return { ok: false, message: `Set ${spec.env.join(", ")} before syncing ${spec.name}.` };
  }
  if (!canApiSync(source)) {
    return {
      ok: false,
      message:
        spec.source === "promo-calendar"
          ? "The live promotion calendar syncs from its Google Sheet row on Sources. Use Sync there."
          : "That source has no connector.",
    };
  }
  if (source === "spins" && spinsDriveLive()) {
    return syncSpinsFromDrive(spec.method);
  }
  if (source === "dsd" && dsdDriveLive()) {
    return syncDsdFromDrive(spec.method);
  }
  const pull = pullers[source];
  if (!pull) return { ok: false, message: "That source has no connector." };
  if (source === "google_sheets") {
    return syncGoogleSheetsBundle(spec.method);
  }
  return execute(source, "", spec.method, pull);
}

async function syncGoogleSheetsBundle(method: string): Promise<SyncState> {
  const parts: string[] = [];
  let ok = true;
  const hub = await execute("google_sheets", "", method, pullGoogleSheets);
  ok = ok && Boolean(hub.ok);
  parts.push(hub.message ?? "Google Sheets: no message.");

  if (keheSalesSheetConfigured()) {
    const sales = await execute("kehe", "sales-through", "Google Sheet pivot or Chains and Stores", pullKeheSalesFromGoogleSheet);
    ok = ok && Boolean(sales.ok);
    parts.push(sales.message ?? "KEHE sales: no message.");
  }

  if (keheStockSheetConfigured()) {
    const stock = await execute("kehe", "stock-status", "Google Sheet Stock Status", pullKeheStockFromGoogleSheet);
    ok = ok && Boolean(stock.ok);
    parts.push(stock.message ?? "KEHE stock: no message.");
  }

  return { ok, message: parts.join(" ") };
}

async function syncDsdFromDrive(method: string): Promise<SyncState> {
  try {
    const jobs = await planDsdDriveJobs();
    if (jobs.length === 0) {
      return {
        ok: false,
        message: "No spreadsheets were found in partner subfolders. Add a Google Sheet or Excel file inside each ALL SALES REPORTS folder.",
      };
    }
    const messages: string[] = [];
    let ok = true;
    for (const job of jobs) {
      const result = await execute("dsd", job.partnerSlug, method, async () => pullDsdDriveFile(job));
      ok = ok && Boolean(result.ok);
      messages.push(result.ok ? (result.message ?? job.partnerSlug) : (result.message ?? `${job.partnerSlug} failed.`));
    }
  const emptyFolders = DSD_PARTNERS.filter(
    (partner) => !jobs.some((job) => job.partnerSlug === partner.slug),
  ).map((partner) => partner.label);
  const tail =
    emptyFolders.length > 0
      ? ` Synced ${jobs.length} partner file(s). No file yet in: ${emptyFolders.slice(0, 8).join(", ")}${emptyFolders.length > 8 ? "…" : ""}.`
      : ` Synced ${jobs.length} partner folder(s).`;
    return { ok, message: messages.join(" ") + tail };
  } catch (error) {
    return { ok: false, message: publicError(error) };
  }
}

async function syncSpinsFromDrive(method: string): Promise<SyncState> {
  try {
    const jobs = await planSpinsDriveJobs();
    if (jobs.length === 0) {
      return { ok: false, message: "No SPINS spreadsheets were found in the Drive folder." };
    }
    const messages: string[] = [];
    let ok = true;
    for (const job of jobs) {
      const partner = spinsPartnerSlug(job.reportKind, job.periodWeeks);
      const result = await execute("spins", partner, method, async () => pullSpinsDriveFile(job));
      ok = ok && Boolean(result.ok);
      messages.push(result.message ?? `${partner}: no message.`);
    }
    const missing = missingSpinsDriveSlots(jobs);
    const tail =
      missing.length > 0
        ? ` ${jobs.length}/12 report windows loaded. Not on Drive yet: ${missing.join(", ")}. See docs/spins-drive-inventory.md.`
        : ` All 12 report windows synced.`;
    const message = `${messages.join(" ")}${tail}`;
    const rowCount = jobs.length;
    await recordSpinsDriveHubRun(method, message, rowCount, ok);
    return { ok, message };
  } catch (error) {
    return { ok: false, message: publicError(error) };
  }
}

/** Sources row uses partner \"\" on SPINS; Drive sync only writes per-report partners unless we log here too. */
async function recordSpinsDriveHubRun(method: string, message: string, rowCount: number, ok: boolean) {
  const sql = getSql();
  if (!sql) return;
  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const connectionId = await upsertConnection(sql, organizationId, "spins", "", method);
    const syncRunId = await startRun(sql, connectionId);
    await finishRun(sql, syncRunId, ok ? "ok" : "error", rowCount, message);
  } catch {
    /* per-window runs already persisted; hub row is for Sources status only */
  }
}

export async function runConfiguredSources(): Promise<SyncState> {
  const ready = sourceCatalog.filter((spec) => spec.kind !== "file" && sourceConfigured(spec) && canApiSync(spec.source));
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

  if (input.source === "promo-calendar") {
    try {
      const parsed = parsePromoCalendar(input.text);
      return execute(input.source, promoPartnerSlug(), spec.method, async () => parsed);
    } catch (error) {
      return { ok: false, message: publicError(error) };
    }
  }

  if (input.source === "sku-pricelist") {
    try {
      const parsed = parseSkuPricelist(input.text);
      const effectiveDate = parsed.skuCatalog?.[0]?.effectiveDate ?? null;
      return execute(input.source, skuPartnerSlug(effectiveDate), spec.method, async () => parsed);
    } catch (error) {
      return { ok: false, message: publicError(error) };
    }
  }

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
  if (input.source === "kehe" || input.source === "unfi") {
    if (!input.reportKind) {
      return { ok: false, message: `Choose a ${input.source === "unfi" ? "UNFI" : "KEHE"} report type before importing.` };
    }
    if (input.source === "unfi") {
      if (input.reportKind !== "sales-through") {
        return { ok: false, message: "UNFI stock status is not wired yet. Import Chains and Stores as sales-through." };
      }
      return execute(input.source, "sales-through", spec.method, async () =>
        parseKeheSalesFile(input.text, { distributor: "unfi" }),
      );
    }
    const kind = input.reportKind === "stock-status" ? "stock-status" : "sales-through";
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
