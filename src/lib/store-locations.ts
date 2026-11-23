import snapshot from "./leilo-stores.json";
import { ensureSchema, getSql, hasDatabase, leiloOrganizationId } from "@/lib/db";
import { mergeSheetLocationsWithSnapshot } from "@/lib/store-locations-merge";

/** Door on the map or in the locator table. */
export type StoreLocation = {
  id: string | number;
  name: string;
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  channel?: string | null;
  website?: string | null;
  phone?: string | null;
  hours?: string | null;
  lastUpdated?: string | null;
};

export type StoreLocationBundle = {
  locations: StoreLocation[];
  source: "sheet" | "snapshot";
  syncedAt: string | null;
  total: number;
};

const jsonLocations = snapshot as StoreLocation[];

export function storeRegionsFrom(locations: Pick<StoreLocation, "region">[]) {
  return [...new Set(locations.map((store) => store.region).filter(Boolean))].sort();
}

/** @deprecated Use loadStoreLocations in server code. Static Closeby snapshot for fallback only. */
export const storeLocations = jsonLocations;

export const storeRegions = storeRegionsFrom(jsonLocations);

export async function loadStoreLocations(): Promise<StoreLocationBundle> {
  if (!hasDatabase()) {
    return { locations: jsonLocations, source: "snapshot", syncedAt: null, total: jsonLocations.length };
  }
  const sql = getSql();
  if (!sql) {
    return { locations: jsonLocations, source: "snapshot", syncedAt: null, total: jsonLocations.length };
  }
  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const rows = await sql.query(
      `SELECT d.door_key, d.name, d.address, d.city, d.region, d.channel, d.website, d.phone, d.hours,
              d.lat, d.lng, d.last_updated,
              (SELECT finished_at FROM sync_runs WHERE id = d.sync_run_id AND status = 'ok') AS synced_at
       FROM store_locator_doors d
       WHERE d.organization_id = $1
       ORDER BY d.region, d.city, d.name`,
      [organizationId],
    );
    const records = Array.isArray(rows) ? rows : [];
    if (records.length === 0) {
      return { locations: jsonLocations, source: "snapshot", syncedAt: null, total: jsonLocations.length };
    }
    const sheetRows = records.map(rowFromDb);
    const merged = mergeSheetLocationsWithSnapshot(sheetRows, jsonLocations);
    const syncedAt = records[0]?.synced_at ? String((records[0] as Record<string, unknown>).synced_at) : null;
    if (merged.length === 0) {
      return { locations: jsonLocations, source: "snapshot", syncedAt, total: jsonLocations.length };
    }
    return { locations: merged, source: "sheet", syncedAt, total: sheetRows.length };
  } catch {
    return { locations: jsonLocations, source: "snapshot", syncedAt: null, total: jsonLocations.length };
  }
}

export async function loadLocatorTable(): Promise<
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      source: "sheet" | "snapshot";
      syncedAt: string | null;
      rows: StoreLocation[];
      regions: string[];
      channels: string[];
    }
> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };
  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const result = await sql.query(
      `SELECT door_key, name, address, city, region, channel, website, phone, hours, lat, lng, last_updated,
              (SELECT finished_at FROM sync_runs WHERE id = sync_run_id AND status = 'ok') AS synced_at
       FROM store_locator_doors
       WHERE organization_id = $1
       ORDER BY region, city, name`,
      [organizationId],
    );
    const records = Array.isArray(result) ? result : [];
    if (records.length === 0) {
      const fallback = jsonLocations.map((row) => ({ ...row, channel: null, lastUpdated: null }));
      return {
        state: "ready",
        source: "snapshot",
        syncedAt: null,
        rows: fallback,
        regions: storeRegionsFrom(fallback),
        channels: [],
      };
    }
    const rows = records.map((raw) => {
      const mapped = rowFromDb(raw as Record<string, unknown>);
      return {
        ...mapped,
        lat: mapped.lat ?? NaN,
        lng: mapped.lng ?? NaN,
      };
    });
    return {
      state: "ready",
      source: "sheet",
      syncedAt: records[0]?.synced_at ? String((records[0] as Record<string, unknown>).synced_at) : null,
      rows,
      regions: storeRegionsFrom(rows),
      channels: [...new Set(rows.map((row) => row.channel).filter(Boolean) as string[])].sort(),
    };
  } catch (error) {
    return { state: "error", message: error instanceof Error ? error.message : "Could not load locations." };
  }
}

function rowFromDb(row: Record<string, unknown>) {
  return {
    id: String(row.door_key ?? ""),
    name: String(row.name ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    region: String(row.region ?? ""),
    lat: row.lat == null ? undefined : Number(row.lat),
    lng: row.lng == null ? undefined : Number(row.lng),
    channel: row.channel ? String(row.channel) : null,
    website: row.website ? String(row.website) : null,
    phone: row.phone ? String(row.phone) : null,
    hours: row.hours ? String(row.hours) : null,
    lastUpdated: row.last_updated ? String(row.last_updated) : null,
  };
}