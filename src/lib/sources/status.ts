import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import { canApiSync } from "@/lib/sources/api-pullers";
import {
  GOOGLE_SHEET_FEEDS,
  promoSheetLive,
  syncMessageForFeed,
  type GoogleSheetFeed,
} from "@/lib/sources/google-sheet-feeds";
import { sheetIdsConfigured, sourceCatalog, sourceConfigured, specFor, type SourceKind } from "@/lib/sources/catalog";
import { infoLinkForCatalogSource, infoLinkForGoogleSheetFeed, type SourceInfoLink } from "@/lib/sources/source-external-links";

export type SourceRow = {
  key: string;
  source: string;
  syncSource: string;
  partner: string;
  name: string;
  method: string;
  kind: SourceKind;
  canSync: boolean;
  status: string;
  lastSuccess: string;
  detail: string;
  infoLink: SourceInfoLink | null;
};

type SavedConnection = {
  source: string;
  partner: string;
  lastSuccess: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
};

export async function listSources(): Promise<{ database: boolean; error: string | null; rows: SourceRow[] }> {
  const database = hasDatabase();
  if (!database) {
    return {
      database,
      error: null,
      rows: sourceCatalog
        .flatMap((spec) => {
          if (spec.source === "google_sheets") return googleSheetRows([], false, null);
          if (spec.source === "promo-calendar" && promoSheetLive()) return [];
          return [present(spec, spec.name, "", null, false)];
        }),
    };
  }

  try {
    const saved = await loadConnections();
    const googleMatch = saved.find((item) => item.source === "google_sheets" && item.partner === "");
    const rows = sourceCatalog.flatMap((spec) => {
      if (spec.source === "google_sheets") {
        return googleSheetRows(saved, true, googleMatch);
      }
      if (spec.source === "promo-calendar" && promoSheetLive()) {
        return [];
      }
      const match = saved.find((item) => item.source === spec.source && item.partner === "");
      return [present(spec, spec.name, "", match, true)];
    });
    for (const extra of saved) {
      if (!extra.partner) continue;
      const spec = specFor(extra.source);
      if (!spec) continue;
      rows.push(present(spec, `${spec.name} · ${extra.partner}`, extra.partner, extra, true));
    }
    return { database, error: null, rows };
  } catch (error) {
    return {
      database,
      error: publicError(error),
      rows: sourceCatalog
        .flatMap((spec) => {
          if (spec.source === "google_sheets") return googleSheetRows([], false, null);
          if (spec.source === "promo-calendar" && promoSheetLive()) return [];
          return [present(spec, spec.name, "", null, false)];
        }),
    };
  }
}

function googleSheetRows(
  saved: SavedConnection[],
  database: boolean,
  googleMatch: SavedConnection | null | undefined,
): SourceRow[] {
  const accountSet = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
  if (!accountSet) {
    const spec = specFor("google_sheets");
    if (!spec) return [];
    const match = saved.find((item) => item.source === "google_sheets" && item.partner === "");
    return [present(spec, spec.name, "", match, database)];
  }

  const active = GOOGLE_SHEET_FEEDS.filter((feed) => Boolean(process.env[feed.sheetEnv]?.trim()));
  if (active.length === 0) {
    const spec = specFor("google_sheets");
    if (!spec) return [];
    return [presentGoogleSheetsPlaceholder(spec, googleMatch, database)];
  }

  return active.map((feed) => presentGoogleSheetFeed(feed, googleMatch, database));
}

function presentGoogleSheetsPlaceholder(
  spec: (typeof sourceCatalog)[number],
  saved: SavedConnection | null | undefined,
  database: boolean,
): SourceRow {
  const row = present(spec, spec.name, "", saved, database);
  row.detail = row.detail || "Add sheet ids (SKU, LTL, locator, promotion calendar).";
  row.status = "Needs sheet ids";
  row.infoLink = null;
  return row;
}

function presentGoogleSheetFeed(
  feed: GoogleSheetFeed,
  saved: SavedConnection | null | undefined,
  database: boolean,
): SourceRow {
  const configured = accountSet();
  const message = saved?.lastMessage ?? "";
  const feedDetail = syncMessageForFeed(message, feed.syncLabel);
  let status = "Ready";
  let detail = feedDetail;

  if (!database) {
    status = "Database not connected";
  } else if (!configured) {
    status = "Needs credentials";
    detail = "Set GOOGLE_SERVICE_ACCOUNT_JSON.";
  } else if (saved?.lastStatus === "error") {
    status = "Last sync failed";
    detail = feedDetail || saved?.lastMessage || detail;
  } else if (saved?.lastStatus === "ok") {
    status = feedDetail ? "Connected" : "No sync yet";
    detail = feedDetail || "Use Sync to pull this sheet with the other configured Google Sheets.";
  } else {
    detail = feedDetail || "Use Sync to pull this sheet with the other configured Google Sheets.";
  }

  return {
    key: `google_sheet:${feed.id}`,
    source: `google_sheet:${feed.id}`,
    syncSource: "google_sheets",
    partner: "",
    name: feed.name,
    method: feed.method,
    kind: "api",
    canSync: database && configured,
    status,
    lastSuccess: formatStamp(saved?.lastSuccess ?? null),
    detail,
    infoLink: infoLinkForGoogleSheetFeed(feed.id),
  };
}

function accountSet() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

function present(
  spec: (typeof sourceCatalog)[number],
  name: string,
  partner: string,
  saved: SavedConnection | null | undefined,
  database: boolean,
): SourceRow {
  const configured = sourceConfigured(spec);
  let status = "Ready";
  let detail = saved?.lastMessage ?? "";
  let canSync = database && spec.kind !== "file" && configured && canApiSync(spec.source);

  if (!database) {
    status = "Database not connected";
    canSync = false;
  } else if (spec.kind === "file" || (spec.kind === "hybrid" && !configured)) {
    status = saved?.lastStatus === "ok" ? "File received" : "File inbox";
    canSync = false;
    if (!detail && spec.source === "unfi") {
      detail = "Upload a sales-through CSV. The UNFI tab stays empty until a file arrives.";
    }
  } else if (!configured) {
    status = "Needs credentials";
    detail = `Set ${spec.env.join(", ")}.`;
    canSync = false;
  } else if (spec.source === "google_sheets" && sheetIdsConfigured().length === 0) {
    status = "Needs sheet ids";
    detail = detail || "Add sheet ids (SKU, LTL, locator, promotion calendar).";
  } else if (saved?.lastStatus === "error") {
    status = "Last sync failed";
  } else if (saved?.lastStatus === "ok") {
    status = "Connected";
  }

  return {
    key: `${spec.source}:${partner}`,
    source: spec.source,
    syncSource: spec.source,
    partner,
    name,
    method: spec.method,
    kind: spec.kind,
    canSync,
    status,
    lastSuccess: formatStamp(saved?.lastSuccess ?? null),
    detail,
    infoLink: infoLinkForCatalogSource(spec.source, partner),
  };
}

async function loadConnections() {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema();
  const organizationId = await leiloOrganizationId(sql);
  const rows = await sql`
    SELECT
      source,
      partner,
      (
        SELECT finished_at FROM sync_runs
        WHERE connection_id = source_connections.id AND status = 'ok'
        ORDER BY finished_at DESC
        LIMIT 1
      ) AS last_success,
      (
        SELECT status FROM sync_runs
        WHERE connection_id = source_connections.id
        ORDER BY started_at DESC
        LIMIT 1
      ) AS last_status,
      (
        SELECT message FROM sync_runs
        WHERE connection_id = source_connections.id
        ORDER BY started_at DESC
        LIMIT 1
      ) AS last_message
    FROM source_connections
    WHERE organization_id = ${organizationId}
  `;
  return rows.map((row) => ({
    source: String(row.source),
    partner: String(row.partner ?? ""),
    lastSuccess: row.last_success ? String(row.last_success) : null,
    lastStatus: row.last_status ? String(row.last_status) : null,
    lastMessage: row.last_message ? String(row.last_message) : null,
  }));
}

function formatStamp(value: string | null) {
  if (!value) return "No successful sync yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No successful sync yet";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}