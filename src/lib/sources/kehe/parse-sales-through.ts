import { blankToNull, isoDate, money, quantity, splitCsv, stableId } from "@/lib/sources/fields";
import { headerKey, pickColumn, recordsFromTable } from "@/lib/sources/kehe/columns";
import type { OrderingMethod, PullResult } from "@/lib/sources/types";

export type DistributorSalesSource = "kehe" | "unfi";

type SalesParseOptions = { distributor?: DistributorSalesSource };

/** KEHE's price to the retailer, from the client write-up. */
export const KEHE_PRICE_PER_CAN = 2.66;
/** A single-can case is 12 cans when the file reports cases and no dollar column. */
export const CANS_PER_CASE = 12;

export function parseKeheSalesThrough(rows: Record<string, string>[], options: SalesParseOptions = {}): PullResult {
  const distributor = options.distributor ?? "kehe";
  const method = orderingMethodFor(distributor);
  const accounts = [];
  const orders = [];
  const raw = [];

  for (const row of rows) {
    const name = blankToNull(pickColumn(row, ["chain", "store name", "store", "customer", "retailer", "account"]));
    const externalId = name ? stableId([distributor, "sales-through", name]) : null;
    const region = blankToNull(pickColumn(row, ["state", "region", "ship state"]));
    if (name && externalId) {
      accounts.push({
        externalId,
        name,
        address: blankToNull(pickColumn(row, ["address", "street", "city"])),
        region,
        industryType: null,
        customerType: null,
        orderingMethod: method,
      });
    }

    const sku = blankToNull(pickColumn(row, ["sku", "item code", "item", "upc"]));
    const description = blankToNull(
      pickColumn(row, ["product description", "item description", "description", "product"]),
    );
    const casesOrdered = optionalQuantity(pickColumn(row, ["cases ordered", "qty ordered", "ordered"]));
    const casesShipped = optionalQuantity(pickColumn(row, ["cases shipped", "qty shipped", "shipped cases"]));
    const units = optionalQuantity(pickColumn(row, ["units shipped", "eaches shipped", "cans shipped", "quantity shipped"]));
    const shippedDollars = money(
      pickColumn(row, [
        "shipped revenue",
        "shipped dollars",
        "shipped $",
        "shipped sales",
        "revenue",
        "sales dollars",
        "dollar sales",
        "dollars",
        "amount",
        "extended price",
      ]),
    );
    const revenue = shippedRevenue(shippedDollars, units, casesShipped);
    const shipDate = isoDate(pickColumn(row, ["ship date", "shipped date", "invoice date", "date"]));
    if (!name && revenue === null && !sku && casesOrdered === null && casesShipped === null) continue;

    const orderKey = stableId([distributor, "sales-through", name ?? "", sku ?? "", shipDate ?? "", JSON.stringify(row)]);
    orders.push({
      externalId: orderKey,
      accountExternalId: externalId,
      orderingMethod: method,
      direction: "through" as const,
      shipDate,
      revenue,
      currency: "USD",
      tags: "",
      excludeFromDirect: true,
      partner: "sales-through",
      lines: [
        {
          sku,
          productType: description,
          quantity: units ?? (casesShipped !== null ? casesShipped * CANS_PER_CASE : null),
          revenue,
          casesOrdered,
          casesShipped,
        },
      ],
    });
    raw.push({ kind: "sale" as const, externalId: orderKey, payload: row });
  }

  return {
    message: `Stored ${orders.length} ${labelFor(distributor)} sales-through rows from ${rows.length} lines. Revenue uses shipped dollars, or $${KEHE_PRICE_PER_CAN} per can when the file has units or cases only.`,
    rowCount: orders.length + accounts.length,
    accounts,
    orders,
    shipments: [],
    raw,
  };
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/** Flat Chains-and-Stores rows, or the monthly retailer pivot Connect exports today. */
export function parseKeheSalesFile(text: string, options: SalesParseOptions = {}): PullResult {
  const table = splitCsv(text.replace(/^\uFEFF/, ""));
  const pivotHeader = table.findIndex((row, index) => index < 15 && isPivotHeader(row));
  if (pivotHeader >= 0) return parseMonthlyPivot(table, pivotHeader, options);
  const header = table.findIndex((row, index) => index < 15 && looksLikeKeheSales(row));
  return parseKeheSalesThrough(recordsFromTable(table, header >= 0 ? header : 0), options);
}

export function looksLikeKeheSales(headers: string[]) {
  const keys = headers.map(headerKey);
  const hasRetailer = keys.some((key) => /chain|store|retailer|customer|account/.test(key));
  const hasMeasure = keys.some((key) => /ship|revenue|dollar|case|qty|upc|sku/.test(key));
  return hasRetailer && hasMeasure;
}

function shippedRevenue(dollars: number | null, units: number | null, casesShipped: number | null) {
  if (dollars !== null) return dollars;
  if (units !== null) return roundMoney(units * KEHE_PRICE_PER_CAN);
  if (casesShipped !== null) return roundMoney(casesShipped * CANS_PER_CASE * KEHE_PRICE_PER_CAN);
  return null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function optionalQuantity(value: string) {
  if (!value.trim()) return null;
  return quantity(value);
}

function isPivotHeader(row: string[]) {
  const joined = row.map(headerKey).join(" ");
  return joined.includes("sku") && /\b(jan|january)\b/.test(joined) && /retailer|store/.test(joined);
}

function parseMonthlyPivot(table: string[][], headerIndex: number, options: SalesParseOptions = {}): PullResult {
  const distributor = options.distributor ?? "kehe";
  const method = orderingMethodFor(distributor);
  const headers = table[headerIndex] ?? [];
  const yearRow = table[headerIndex - 1] ?? [];
  const months = monthColumns(yearRow, headers);
  const keys = headers.map(headerKey);
  const retailerIdx = keys.findIndex((key) => key === "retailer name" || key === "retailer" || key === "chain");
  const mainIdx = keys.findIndex((key) => key === "main store");
  const subIdx = keys.findIndex((key) => key === "sub store" || key === "store" || key === "store name");
  const skuIdx = keys.findIndex((key) => key === "sku" || key === "upc" || key === "item");

  const accounts = [];
  const orders = [];
  const raw = [];
  const seenAccounts = new Set<string>();
  let retailer = "";
  let main = "";
  let sub = "";

  for (const row of table.slice(headerIndex + 1)) {
    const retailerCell = cell(row, retailerIdx);
    const mainCell = cell(row, mainIdx);
    const subCell = cell(row, subIdx);
    const skuCell = cell(row, skuIdx);
    if ([retailerCell, mainCell, subCell, skuCell].some(isTotalLabel)) continue;
    if (retailerCell) {
      retailer = retailerCell;
      main = mainCell;
      sub = subCell;
    } else {
      if (mainCell) main = mainCell;
      if (subCell) sub = subCell;
    }
    if (!skuCell) continue;
    const store = sub || main || retailer;
    if (!store) continue;

    const upc = skuCell.match(/\((\d{6,14})\)/)?.[1] ?? skuCell;
    const description = skuCell.replace(/\s*\([^)]*\)\s*$/, "").trim() || skuCell;
    const externalId = stableId([distributor, "sales-through", store]);
    if (!seenAccounts.has(externalId)) {
      seenAccounts.add(externalId);
      accounts.push({
        externalId,
        name: store,
        address: null,
        region: stateFromStore(store),
        industryType: null,
        customerType: null,
        orderingMethod: method,
      });
    }

    const shipments = [];
    for (const month of months) {
      const revenue = money(row[month.index] ?? "");
      if (revenue === null || revenue === 0) continue;
      const shipDate = `${month.year}-${String(month.month).padStart(2, "0")}-01`;
      const orderKey = stableId([distributor, "sales-through", store, upc, shipDate]);
      shipments.push({ shipDate, revenue });
      orders.push({
        externalId: orderKey,
        accountExternalId: externalId,
        orderingMethod: method,
        direction: "through" as const,
        shipDate,
        revenue,
        currency: "USD",
        tags: "",
        excludeFromDirect: true,
        partner: "sales-through",
        lines: [
          {
            sku: upc,
            productType: description,
            quantity: null,
            revenue,
            casesOrdered: null,
            casesShipped: null,
          },
        ],
      });
    }
    if (shipments.length === 0) continue;
    raw.push({
      kind: "sale" as const,
      externalId: stableId([distributor, "pivot", store, upc, skuCell]),
      payload: { retailer, store, sku: upc, description, shipments },
    });
  }

  return {
    message: `Stored ${orders.length} monthly ${labelFor(distributor)} shipments across ${accounts.length} stores. This pivot has shipped dollars by month. Fill rate stays empty until a file includes cases ordered and cases shipped.`,
    rowCount: orders.length + accounts.length,
    accounts,
    orders,
    shipments: [],
    raw,
  };
}

function monthColumns(yearRow: string[], headers: string[]) {
  let year: number | null = null;
  const columns: { index: number; year: number; month: number }[] = [];
  for (let index = 0; index < headers.length; index += 1) {
    const yearMatch = (yearRow[index] ?? "").match(/\b(20\d{2})\b/);
    const yearLabel = headerKey(yearRow[index] ?? "");
    if (yearMatch && !yearLabel.includes("total")) year = Number(yearMatch[1]);
    const header = headerKey(headers[index] ?? "");
    if (!header || header.includes("total")) continue;
    const month = MONTHS[header];
    if (!month || year === null) continue;
    columns.push({ index, year, month });
  }
  return columns;
}

function cell(row: string[], index: number) {
  if (index < 0) return "";
  return row[index]?.trim() ?? "";
}

function isTotalLabel(value: string) {
  return /\btotal\b/i.test(value);
}

function stateFromStore(name: string) {
  const match = name.match(/,\s*([A-Z]{2})\s*$/);
  return match?.[1] ?? null;
}

function orderingMethodFor(distributor: DistributorSalesSource): OrderingMethod {
  return distributor === "unfi" ? "UNFI" : "KEHE";
}

function labelFor(distributor: DistributorSalesSource) {
  return distributor === "unfi" ? "UNFI" : "KEHE";
}
