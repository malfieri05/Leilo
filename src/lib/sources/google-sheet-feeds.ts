export type GoogleSheetFeed = {
  id: string;
  name: string;
  syncLabel: string;
  sheetEnv: string;
  gidEnv?: string;
  method: string;
};

export const GOOGLE_SHEET_FEEDS: GoogleSheetFeed[] = [
  {
    id: "promo",
    name: "Promo calendar (Google Sheet)",
    syncLabel: "Promotion calendar",
    sheetEnv: "GOOGLE_SHEET_PROMO_ID",
    gidEnv: "GOOGLE_SHEET_PROMO_GID",
    method: "Live KEHE and UNFI promotion matrix",
  },
  {
    id: "sku",
    name: "SKU master list (Google Sheet)",
    syncLabel: "SKU and price list",
    sheetEnv: "GOOGLE_SHEET_SKU_ID",
    method: "Master pricelist reference rows",
  },
  {
    id: "ltl",
    name: "LTL bill of lading (Google Sheet)",
    syncLabel: "LTL bill of lading",
    sheetEnv: "GOOGLE_SHEET_LTL_ID",
    method: "KeHE tab · #B- order ids",
  },
  {
    id: "locator",
    name: "Leilo locations (Google Sheet)",
    syncLabel: "Leilo locations",
    sheetEnv: "GOOGLE_SHEET_LOCATOR_ID",
    gidEnv: "GOOGLE_SHEET_LOCATOR_GID",
    method: "Company store list — address, channel, and coordinates",
  },
  {
    id: "kehe-sales",
    name: "KEHE sales-through (Google Sheet)",
    syncLabel: "KEHE sales-through",
    sheetEnv: "GOOGLE_SHEET_KEHE_SALES_ID",
    gidEnv: "GOOGLE_SHEET_KEHE_SALES_GID",
    method: "Pivot or Chains and Stores — sales through to retailers",
  },
  {
    id: "kehe-stock",
    name: "KEHE stock status (Google Sheet)",
    syncLabel: "KEHE stock status",
    sheetEnv: "GOOGLE_SHEET_KEHE_STOCK_ID",
    gidEnv: "GOOGLE_SHEET_KEHE_STOCK_GID",
    method: "DC inventory for the KEHE tab stock chart",
  },
];

export function googleSheetEditUrl(sheetId: string, gid?: string | null) {
  const id = sheetId.trim();
  if (!id) return null;
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/edit`;
  const tab = gid?.trim();
  return tab ? `${base}?gid=${encodeURIComponent(tab)}#gid=${encodeURIComponent(tab)}` : base;
}

export function feedSheetUrl(feed: GoogleSheetFeed) {
  const sheetId = process.env[feed.sheetEnv]?.trim() ?? "";
  if (!sheetId) return null;
  const gid = feed.gidEnv ? (process.env[feed.gidEnv]?.trim() ?? "") : "";
  return googleSheetEditUrl(sheetId, gid || null);
}

export function promoSheetLive() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() &&
      process.env.GOOGLE_SHEET_PROMO_ID?.trim(),
  );
}

/** Connector jobs in pull order (keep in sync with GOOGLE_SHEET_FEEDS). */
export function sheetConnectorJobs() {
  return GOOGLE_SHEET_FEEDS.map((feed) => ({
    env: feed.sheetEnv,
    label: feed.syncLabel,
    kind:
      feed.id === "promo"
        ? ("promo" as const)
        : feed.id === "ltl"
          ? ("shipment" as const)
          : feed.id === "locator"
            ? ("locator" as const)
            : ("reference" as const),
  }));
}

export function syncMessageForFeed(message: string, syncLabel: string) {
  const text = message.trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  const needle = `${syncLabel.toLowerCase()}:`;
  const start = lower.indexOf(needle);
  if (start < 0) return "";
  const rest = text.slice(start);
  const tail = rest.slice(needle.length);
  const next = tail.search(/\.\s+(?=[A-Z0-9])/);
  if (next === -1) return rest.trim();
  return `${rest.slice(0, needle.length + next + 1)}`.trim();
}