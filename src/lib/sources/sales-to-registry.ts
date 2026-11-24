import type { OrderingMethod } from "@/lib/sources/types";

/** Canonical sales-to targets from docs/ark-brain.md (Distributors + national). */
export type SalesToMatch = {
  orderingMethod: Exclude<OrderingMethod, "Direct" | "Unclassified">;
  partnerSlug: string;
  matchedLabel: string;
};

type RegistryEntry = {
  method: Exclude<OrderingMethod, "Direct" | "Unclassified">;
  slug: string;
  labels: string[];
};

/** National distributors first, then DSD partners (ARK Brain Nov 2026). */
const SALES_TO_REGISTRY: RegistryEntry[] = [
  { method: "KEHE", slug: "kehe", labels: ["KEHE", "KEHE Distributors", "KeHE Distributors", "Kehe"] },
  { method: "UNFI", slug: "unfi", labels: ["UNFI", "United Natural Foods"] },
  {
    method: "DSD",
    slug: "alabev",
    labels: ["AlaBev", "Alabev"],
  },
  { method: "DSD", slug: "botanical-channel", labels: ["Botanical Channel"] },
  { method: "DSD", slug: "briggs", labels: ["Briggs Distributing", "Briggs"] },
  { method: "DSD", slug: "cali-sober", labels: ["Cali Sober Distribution", "Cali Sober"] },
  {
    method: "DSD",
    slug: "craft-collective",
    labels: ["Craft Collective Homegrown", "Craft Collective", "CCHG"],
  },
  { method: "DSD", slug: "elite-brands", labels: ["Elite Brands", "Elite Brandsco"] },
  {
    method: "DSD",
    slug: "empire",
    labels: ["Empire Beverage", "Empire Distributors", "Empire Beverage Empire Distributors"],
  },
  { method: "DSD", slug: "gold-coast", labels: ["Gold Coast Distribution", "Gold Coast", "Goldcoast"] },
  { method: "DSD", slug: "gusto", labels: ["Gusto Distributing", "Gusto"] },
  {
    method: "DSD",
    slug: "infd",
    labels: ["INFD", "SMNR", "SMNR Sales LLC", "INFD formerly SMNR"],
  },
  { method: "DSD", slug: "john-lenore", labels: ["John Lenore", "JLC", "John Lenore JLC"] },
  {
    method: "DSD",
    slug: "lad",
    labels: ["LAD", "Los Angeles Distributing", "Los Angeles Distribution"],
  },
  { method: "DSD", slug: "kmt", labels: ["KMT Distribution", "KMT"] },
  { method: "DSD", slug: "mexcor", labels: ["Mexcor", "MexCor"] },
  { method: "DSD", slug: "mission", labels: ["Mission Sales"] },
  {
    method: "DSD",
    slug: "my-beverage",
    labels: ["My Beverage Company", "My Beverage Co"],
  },
  {
    method: "DSD",
    slug: "premier-island",
    labels: ["Premier Island Brokerage", "Premier Island", "PIB"],
  },
  { method: "DSD", slug: "romano", labels: ["Romano Beverage", "Romano"] },
  { method: "DSD", slug: "sixth-city", labels: ["Sixth City Distribution", "6th City Distribution", "6th City"] },
  { method: "DSD", slug: "bellwether", labels: ["Bellwether", "Longstraw", "Longstraw LLC", "David Bowers"] },
  { method: "DSD", slug: "travis-doupe", labels: ["Travis Doupe", "Botanical Channel Travis"] },
  { method: "DSD", slug: "monica-louisiana", labels: ["Cali Sober Monica", "Monica Cali Sober"] },
  { method: "DSD", slug: "vr-distributors", labels: ["VR Distributors"] },
];

const MATCHERS: { entry: RegistryEntry; normalized: string }[] = [];
for (const entry of SALES_TO_REGISTRY) {
  for (const label of entry.labels) {
    const normalized = normalizeAccountName(label);
    if (normalized) MATCHERS.push({ entry, normalized });
  }
}
MATCHERS.sort((a, b) => b.normalized.length - a.normalized.length);

export function normalizeAccountName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ship-to identity: Shopify customer name and optional shipping company. */
export function matchSalesToShipTo(customerName: string | null | undefined, shippingCompany?: string | null) {
  const candidates = [shippingCompany, customerName].filter(Boolean) as string[];
  for (const raw of candidates) {
    const hit = matchSingleName(raw);
    if (hit) return hit;
  }
  return null;
}

function matchSingleName(raw: string): SalesToMatch | null {
  const key = normalizeAccountName(raw);
  if (!key) return null;

  for (const { entry, normalized } of MATCHERS) {
    if (nameMatchesPhrase(key, normalized)) {
      return {
        orderingMethod: entry.method,
        partnerSlug: entry.slug,
        matchedLabel: entry.labels[0] ?? entry.slug,
      };
    }
  }

  if (key.includes("kehe") || /\bke he\b/.test(key)) {
    return { orderingMethod: "KEHE", partnerSlug: "kehe", matchedLabel: "KEHE" };
  }
  if (key.includes("unfi") || key.includes("united natural foods")) {
    return { orderingMethod: "UNFI", partnerSlug: "unfi", matchedLabel: "UNFI" };
  }

  return null;
}

function nameMatchesPhrase(key: string, phrase: string) {
  if (key === phrase) return true;
  if (phrase.length <= 3) return key === phrase;
  return key.includes(phrase);
}

function escapePgRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
}

/** Postgres: exclude distributor customers from retailer account-health rollups. */
export function distributorAccountNameRegex() {
  const needles = new Set<string>(["kehe", "unfi"]);
  for (const entry of SALES_TO_REGISTRY) {
    for (const label of entry.labels) {
      const token = normalizeAccountName(label);
      if (token.length >= 3) needles.add(token);
    }
  }
  return [...needles]
    .sort((a, b) => b.length - a.length)
    .map(escapePgRegex)
    .join("|");
}

export function excludeDistributorAccountSql(column: string) {
  return `AND NOT (lower(btrim(${column})) ~* '${distributorAccountNameRegex()}')`;
}