export const orderingMethods = ["Direct", "DSD", "KEHE", "UNFI", "Unclassified"] as const;
export type OrderingMethod = (typeof orderingMethods)[number];

export const directions = ["direct", "to", "through"] as const;
export type SalesDirection = (typeof directions)[number];

export type AccountDraft = {
  externalId: string;
  name: string;
  address: string | null;
  region: string | null;
  industryType: string | null;
  customerType: string | null;
  orderingMethod: string | null;
};

export type LineDraft = {
  sku: string | null;
  productType: string | null;
  quantity: number | null;
  revenue: number | null;
  casesOrdered?: number | null;
  casesShipped?: number | null;
};

export type KeheInventoryDraft = {
  dcCode: string;
  dcName: string;
  rowKind: "sku" | "subtotal";
  upc: string;
  sku: string | null;
  description: string | null;
  qtyOnHand: number | null;
  qtyOnPo: number | null;
  weeksOnHand: number | null;
  weeksOnPo: number | null;
  qtyOnSalesOrder: number | null;
  vendorCasePack: number | null;
};

export type OrderDraft = {
  externalId: string;
  accountExternalId: string | null;
  orderingMethod: OrderingMethod;
  direction: SalesDirection;
  shipDate: string | null;
  revenue: number | null;
  currency: string | null;
  tags: string;
  excludeFromDirect: boolean;
  partner: string;
  /** Shopify order name, such as #B-2586, used to join ShipStation tracking. */
  reference?: string | null;
  lines: LineDraft[];
};

export type ShipmentDraft = {
  externalId: string;
  orderExternalId: string | null;
  status: string | null;
  deliveredAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  destination?: string | null;
  relevantUntil: string | null;
};

export type RawDraft = {
  kind: "sale" | "reference" | "category" | "shipment";
  externalId: string | null;
  payload: unknown;
};

export type SpinsRowDraft = {
  reportKind: string;
  periodWeeks: number;
  brand: string | null;
  itemLabel: string | null;
  upc: string | null;
  retailer: string | null;
  geography: string | null;
  dollars: number | null;
  units: number | null;
  rank: number | null;
  dollarsPct: number | null;
  unitsPct: number | null;
  included: boolean;
  payload: Record<string, string>;
};

export type SkuCatalogDraft = {
  catalogKey: string;
  effectiveDate: string | null;
  category: string;
  itemNumber: string | null;
  keheEsn: string | null;
  unitUpc: string | null;
  caseUpc: string | null;
  gtin: string | null;
  ranking: number | null;
  description: string;
  innerPack: string | null;
  masterPack: number | null;
  unitSize: string | null;
  fobUnit: number | null;
  fobInner: number | null;
  fobCase: number | null;
  deliveredUnit: number | null;
  deliveredInner: number | null;
  deliveredCase: number | null;
  dsdUnit: number | null;
  dsdInner: number | null;
  dsdCase: number | null;
  msrp: number | null;
  logistics: Record<string, string>;
  isFourPack: boolean;
  format: "single" | "four-pack" | "stick";
  supplementFactsUrl: string | null;
  payload: string[];
};

export type PromoEventDraft = {
  eventKey: string;
  account: string;
  accountType: string | null;
  distributor: string | null;
  channel: string;
  year: number;
  month: number;
  monthLabel: string;
  summary: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  rowOrder: number;
  notes: string | null;
};

export type PromoMatrixRow = {
  account: string;
  accountType: string;
  distributor: string;
  channel: string;
  notes: string | null;
  cells: string[];
};

export type PromoSnapshotDraft = {
  title: string;
  sourceNote: string;
  months: string[];
  rows: PromoMatrixRow[];
};

export type StoreLocatorDoorDraft = {
  doorKey: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  channel: string | null;
  website: string | null;
  phone: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  lastUpdated: string | null;
  payload: Record<string, string>;
};

export type PullResult = {
  message: string;
  rowCount: number;
  skipped?: boolean;
  accounts: AccountDraft[];
  orders: OrderDraft[];
  shipments: ShipmentDraft[];
  raw: RawDraft[];
  inventory?: KeheInventoryDraft[];
  spinsRows?: SpinsRowDraft[];
  skuCatalog?: SkuCatalogDraft[];
  promoEvents?: PromoEventDraft[];
  promoSnapshot?: PromoSnapshotDraft;
  storeLocatorDoors?: StoreLocatorDoorDraft[];
};

export type SyncState = {
  ok: boolean;
  message: string;
} | null;
