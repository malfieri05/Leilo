export type SourceKind = "api" | "file" | "hybrid";

export type SourceSpec = {
  source: string;
  name: string;
  method: string;
  kind: SourceKind;
  env: string[];
};

export const sourceCatalog: SourceSpec[] = [
  {
    source: "shopify",
    name: "Shopify",
    method: "Admin API, Dev Dashboard app, client-credentials grant",
    kind: "api",
    env: ["SHOPIFY_SHOP", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"],
  },
  {
    source: "hubspot",
    name: "HubSpot",
    method: "Service key. Industry Type is the industry_type property",
    kind: "api",
    env: ["HUBSPOT_ACCESS_TOKEN"],
  },
  {
    source: "zoominfo",
    name: "ZoomInfo",
    method: "GTM API client credentials. Company search for prospect retailers",
    kind: "api",
    env: ["ZOOMINFO_CLIENT_ID", "ZOOMINFO_CLIENT_SECRET"],
  },
  {
    source: "shipstation",
    name: "ShipStation",
    method: "API key and secret. Tracking stays relevant for 21 days after delivery",
    kind: "api",
    env: ["SHIPSTATION_API_KEY", "SHIPSTATION_API_SECRET"],
  },
  {
    source: "google_sheets",
    name: "Google Sheets",
    method: "Service account read for each sheet id in environment variables",
    kind: "api",
    env: ["GOOGLE_SERVICE_ACCOUNT_JSON"],
  },
  {
    source: "spins",
    name: "SPINS",
    method: "Data Access API when MyExtracts is enabled, otherwise a file extract",
    kind: "hybrid",
    env: ["SPINS_API_KEY", "SPINS_API_URL"],
  },
  {
    source: "kehe",
    name: "KEHE",
    method: "CSV export from Connect Supplier. Fill rate is cases shipped divided by cases ordered",
    kind: "file",
    env: [],
  },
  {
    source: "unfi",
    name: "UNFI",
    method: "CSV sales-through (same column map as KEHE Connect doc)",
    kind: "file",
    env: [],
  },
  {
    source: "dsd",
    name: "DSD partners",
    method: "Named file feed: DSD Link export, or the emailed spreadsheet",
    kind: "file",
    env: [],
  },
  {
    source: "encompass",
    name: "Encompass",
    method: "Partner export until MexCor grants PartnerLink",
    kind: "file",
    env: [],
  },
  {
    source: "sku-pricelist",
    name: "SKU master list",
    method: "CSV export of the B2B master price list",
    kind: "file",
    env: [],
  },
  {
    source: "promo-calendar",
    name: "Promotion calendar (CSV)",
    method: "KEHE and UNFI calendar export when the Google Sheet is not wired",
    kind: "hybrid",
    env: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SHEET_PROMO_ID"],
  },
];

export const fileSources = sourceCatalog.filter((spec) => spec.kind !== "api");

export function specFor(source: string) {
  return sourceCatalog.find((spec) => spec.source === source) ?? null;
}

export function sourceConfigured(spec: SourceSpec) {
  if (spec.env.length === 0) return spec.kind === "file";
  return spec.env.every((key) => Boolean(process.env[key]?.trim()));
}

export function sheetIdsConfigured() {
  return ["GOOGLE_SHEET_SKU_ID", "GOOGLE_SHEET_LTL_ID", "GOOGLE_SHEET_LOCATOR_ID", "GOOGLE_SHEET_PROMO_ID"].filter(
    (key) => Boolean(process.env[key]?.trim()),
  );
}
