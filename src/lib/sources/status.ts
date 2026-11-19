import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import { sheetIdsConfigured, sourceCatalog, sourceConfigured, specFor, type SourceKind } from "@/lib/sources/catalog";

export type SourceRow = {
  key: string;
  source: string;
  partner: string;
  name: string;
  method: string;
  kind: SourceKind;
  canSync: boolean;
  status: string;
  lastSuccess: string;
  detail: string;
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
    return { database, error: null, rows: sourceCatalog.map((spec) => present(spec, spec.name, "", null, false)) };
  }

  try {
    const saved = await loadConnections();
    const rows = sourceCatalog.map((spec) => {
      const match = saved.find((item) => item.source === spec.source && item.partner === "");
      return present(spec, spec.name, "", match, true);
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
      rows: sourceCatalog.map((spec) => present(spec, spec.name, "", null, false)),
    };
  }
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
  let canSync = database && spec.kind !== "file" && configured;

  if (!database) {
    status = "Database not connected";
    canSync = false;
  } else if (spec.kind === "file" || (spec.kind === "hybrid" && !configured)) {
    status = saved?.lastStatus === "ok" ? "File received" : "File inbox";
    canSync = false;
    if (!detail && spec.source === "unfi") {
      detail = "UNFI is not active. The file inbox is ready when it is turned on.";
    }
  } else if (!configured) {
    status = "Needs credentials";
    detail = `Set ${spec.env.join(", ")}.`;
    canSync = false;
  } else if (spec.source === "google_sheets" && sheetIdsConfigured().length === 0) {
    status = "Needs sheet ids";
    detail = detail || "Add the SKU, LTL, and store-locator sheet ids.";
  } else if (saved?.lastStatus === "error") {
    status = "Last sync failed";
  } else if (saved?.lastStatus === "ok") {
    status = "Connected";
  }

  return {
    key: `${spec.source}:${partner}`,
    source: spec.source,
    partner,
    name,
    method: spec.method,
    kind: spec.kind,
    canSync,
    status,
    lastSuccess: formatStamp(saved?.lastSuccess ?? null),
    detail,
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
