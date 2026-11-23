import { stableId } from "@/lib/sources/fields";
import type { StoreLocatorDoorDraft } from "@/lib/sources/types";

const HEADER_ALIASES: Record<string, string[]> = {
  doorId: ["id", "store id", "door id", "location id", "retailer id"],
  name: ["store", "store name", "name", "title", "location", "retailer", "account"],
  address: ["address", "street", "street address", "full address", "location address"],
  city: ["city", "town"],
  region: ["region", "state", "st", "province", "state/province"],
  channel: ["channel", "type", "categories", "category", "ordering method", "ordering_method", "source"],
  lat: ["lat", "latitude", "y"],
  lng: ["lng", "long", "longitude", "lon", "x"],
  lastUpdated: ["last updated", "updated", "last_updated", "date updated"],
  website: ["website", "url", "web"],
  phone: ["phone", "phone number", "telephone"],
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function parseLocatorSheet(rows: Record<string, string>[]) {
  if (rows.length === 0) throw new Error("The locations sheet has no rows.");
  const doors: StoreLocatorDoorDraft[] = [];
  for (const row of rows) {
    const mapped = mapRow(row);
    const name = mapped.name.replace(/\r/g, "").trim();
    if (!name) continue;
    const address = mapped.address.replace(/\r/g, "").trim();
    const parsed = parseUsAddress(address);
    const city = mapped.city || parsed.city;
    const region = mapped.region || parsed.region || regionFromAddress(address);
    const lat = numberOrNull(mapped.lat);
    const lng = numberOrNull(mapped.lng);
    const doorKey =
      mapped.doorId?.trim() ||
      stableId([name, address, city, region].filter(Boolean).map((v) => v.toLowerCase()));
    doors.push({
      doorKey,
      name,
      address: address || null,
      city: city || null,
      region: region || null,
      channel: mapped.channel || null,
      website: mapped.website || null,
      phone: mapped.phone || null,
      hours: hoursFromRow(row),
      lat,
      lng,
      lastUpdated: mapped.lastUpdated || null,
      payload: row,
    });
  }
  if (doors.length === 0) {
    throw new Error("No store rows were recognized. Expected a name column (Title or Store) and Address.");
  }
  return {
    storeLocatorDoors: doors,
    message: `Stored ${doors.length} Leilo locations.`,
    raw: [
      {
        kind: "reference" as const,
        externalId: "leilo-locations",
        payload: { count: doors.length },
      },
    ],
  };
}

function mapRow(row: Record<string, string>) {
  const byKey = new Map<string, string>();
  for (const [header, value] of Object.entries(row)) {
    byKey.set(normalizeHeader(header), value.trim());
  }
  const read = (field: keyof typeof HEADER_ALIASES) => {
    for (const alias of HEADER_ALIASES[field]) {
      const hit = byKey.get(normalizeHeader(alias));
      if (hit) return hit;
    }
    return "";
  };
  return {
    doorId: read("doorId"),
    name: read("name"),
    address: read("address"),
    city: read("city"),
    region: read("region"),
    channel: read("channel"),
    website: read("website"),
    phone: read("phone"),
    lat: read("lat"),
    lng: read("lng"),
    lastUpdated: read("lastUpdated"),
  };
}

export function hoursFromRow(row: Record<string, string>) {
  const lines: string[] = [];
  for (const day of DAY_KEYS) {
    const key = Object.keys(row).find((header) => normalizeHeader(header) === `hours ${day}`);
    const value = key ? row[key]?.trim() : "";
    if (!value) continue;
    lines.push(`${dayLabel(day)} ${value}`);
  }
  return lines.length > 0 ? lines.join(" · ") : null;
}

function dayLabel(day: (typeof DAY_KEYS)[number]) {
  return { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" }[day];
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function parseUsAddress(address: string) {
  const cleaned = address.replace(/\r/g, "").trim();
  if (!cleaned) return { city: "", region: "" };
  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 4 && /^\d{5}(-\d{4})?$/.test(parts[parts.length - 1] ?? "")) {
    return {
      city: parts[parts.length - 3] ?? "",
      region: (parts[parts.length - 2] ?? "").match(/^([A-Z]{2})$/i)?.[1]?.toUpperCase() ?? "",
    };
  }
  if (parts.length >= 3) {
    const tail = parts[parts.length - 1] ?? "";
    const stateMatch = tail.match(/\b([A-Z]{2})\b/);
    return {
      city: parts[parts.length - 2] ?? "",
      region: stateMatch?.[1]?.toUpperCase() ?? "",
    };
  }
  if (parts.length === 2) {
    const tail = parts[1] ?? "";
    const match = tail.match(/^(.+?)\s+([A-Z]{2})\s*(\d{5}(-\d{4})?)?$/i);
    if (match) return { city: match[1].trim(), region: match[2].toUpperCase() };
    return { city: parts[0], region: regionFromAddress(cleaned) };
  }
  return { city: "", region: regionFromAddress(cleaned) };
}

function regionFromAddress(address: string) {
  const match =
    address.match(/,\s*([A-Z]{2}),\s*\d{5}/i) ||
    address.match(/,\s*([A-Z]{2})\s+\d{5}/i) ||
    address.match(/,\s*([A-Z]{2})\s*$/i);
  return match ? match[1].toUpperCase() : "";
}

function numberOrNull(value: string) {
  if (!value) return null;
  const amount = Number(value.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}