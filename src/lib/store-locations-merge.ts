import { stableId } from "@/lib/sources/fields";
import type { StoreLocation } from "@/lib/store-locations";

export type SheetLocationRow = Omit<StoreLocation, "lat" | "lng"> & { lat?: number; lng?: number };

export function mergeSheetLocationsWithSnapshot(
  sheetRows: SheetLocationRow[],
  snapshot: StoreLocation[],
): StoreLocation[] {
  const index = new Map<string, StoreLocation>();
  for (const door of snapshot) {
    index.set(matchKey(door.name, door.address), door);
    index.set(matchKey("", door.address), door);
  }

  const merged: StoreLocation[] = [];
  for (const row of sheetRows) {
    let lat = row.lat ?? NaN;
    let lng = row.lng ?? NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const hit = index.get(matchKey(row.name, row.address)) ?? index.get(matchKey("", row.address));
      if (hit) {
        lat = hit.lat;
        lng = hit.lng;
      }
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    merged.push({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      region: row.region,
      lat,
      lng,
      channel: row.channel ?? null,
      website: row.website ?? null,
      phone: row.phone ?? null,
      hours: row.hours ?? null,
      lastUpdated: row.lastUpdated ?? null,
    });
  }
  return merged;
}

function matchKey(name: string, address: string) {
  const street = normalizeAddress(address);
  const label = normalizeLabel(name);
  return stableId([label, street].filter(Boolean));
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/\r/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeAddress(value: string) {
  return value
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/\b(suite|ste|unit|untie|#)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}