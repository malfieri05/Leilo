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
    method: "Private app token. Industry Type is the industry_type property",
    kind: "api",
    env: ["HUBSPOT_ACCESS_TOKEN"],
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
    method: "Service account. Sheets are shared to that account",
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
    method: "Same file inbox as KEHE. Left unwired until UNFI is turned on",
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
  return ["GOOGLE_SHEET_SKU_ID", "GOOGLE_SHEET_LTL_ID", "GOOGLE_SHEET_LOCATOR_ID"].filter(
    (key) => Boolean(process.env[key]?.trim()),
  );
}
