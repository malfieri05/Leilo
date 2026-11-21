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
  lines: LineDraft[];
};

export type ShipmentDraft = {
  externalId: string;
  orderExternalId: string | null;
  status: string | null;
  deliveredAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
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
};

export type SyncState = {
  ok: boolean;
  message: string;
} | null;
