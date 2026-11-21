import {
  blankToNull,
  isoDate,
  money,
  orderingMethodFromText,
  parseCsv,
  pick,
  quantity,
  saleDirection,
  stableId,
} from "@/lib/sources/fields";
import { dsdLineRevenue } from "@/lib/sources/dsd-model";
import type { OrderingMethod, PullResult } from "@/lib/sources/types";

const methodBySource: Record<string, OrderingMethod> = {
  kehe: "KEHE",
  unfi: "UNFI",
  dsd: "DSD",
  encompass: "DSD",
};

export function draftsFromFile(source: string, partner: string, rows: Record<string, string>[]): PullResult {
  const kept = rows.slice(0, 5000);
  const truncated = rows.length > kept.length;
  const method = methodBySource[source] ?? orderingMethodFromText(source);
  const { direction, excludeFromDirect } = saleDirection(method, "file");
  const accounts = [];
  const orders = [];
  const raw = [];

  for (const row of kept) {
    const accountName = pick(row, ["account", "store name", "customer", "retailer", "chain", "store"]);
    const accountExternalId = accountName ? stableId([source, partner, accountName]) : null;
    if (accountName && accountExternalId) {
      accounts.push({
        externalId: accountExternalId,
        name: accountName,
        address: blankToNull(pick(row, ["address", "street"])),
        region: blankToNull(pick(row, ["state", "region", "ship state"])),
        industryType: null,
        customerType: null,
        orderingMethod: method,
      });
    }

    const orderNumber = pick(row, ["order number", "order #", "invoice", "po number", "po"]);
    const dollars = money(pick(row, ["revenue", "sales dollars", "dollar sales", "dollars", "amount", "extended price", "total"]));
    const cases = optionalQty(pick(row, ["cases shipped", "cases ordered", "cases"]));
    const eaches = optionalQty(pick(row, ["units", "qty shipped", "quantity", "qty", "eaches"]));
    const sku = blankToNull(pick(row, ["sku", "item code", "item", "upc"]));
    const productType = blankToNull(pick(row, ["product", "description", "item description"]));
    const revenue =
      source === "dsd" || source === "encompass"
        ? dsdLineRevenue({ dollars, cases, units: eaches, sku, title: productType })
        : dollars;
    const units = eaches ?? cases;
    if (orderNumber || revenue !== null || units !== null || sku || productType) {
      orders.push({
        externalId: orderNumber || stableId([source, partner, JSON.stringify(row)]),
        accountExternalId,
        orderingMethod: method,
        direction,
        shipDate: isoDate(pick(row, ["ship date", "shipped date", "invoice date", "order date", "date"])),
        revenue,
        currency: "USD",
        tags: "",
        excludeFromDirect,
        partner,
        lines: [
          {
            sku,
            productType,
            quantity: units,
            revenue,
          },
        ],
      });
    }

    raw.push({ kind: "sale" as const, externalId: orderNumber || null, payload: row });
  }

  const fill = source === "kehe" ? keheFillRate(kept) : null;
  const suffix = truncated ? " The file was longer than 5,000 rows, so the rest was not stored." : "";
  const fillNote = fill ? ` Fill rate is ${fill}.` : "";
  return {
    message: `Stored ${orders.length} orders and ${accounts.length} accounts from ${kept.length} rows.${fillNote}${suffix}`,
    rowCount: orders.length + accounts.length,
    accounts,
    orders,
    shipments: [],
    raw,
  };
}

function optionalQty(value: string) {
  if (!value.trim()) return null;
  return quantity(value);
}

function keheFillRate(rows: Record<string, string>[]) {
  let ordered = 0;
  let shipped = 0;
  for (const row of rows) {
    const casesOrdered = quantity(pick(row, ["cases ordered", "qty ordered", "ordered"]));
    const casesShipped = quantity(pick(row, ["cases shipped", "qty shipped", "shipped"]));
    if (casesOrdered) ordered += casesOrdered;
    if (casesShipped) shipped += casesShipped;
  }
  if (!ordered) return null;
  return `${Math.round((shipped / ordered) * 1000) / 10}% (${shipped} shipped / ${ordered} ordered)`;
}

export function parseDelimited(filename: string, text: string) {
  const source = filename.toLowerCase();
  if (source.endsWith(".xlsx") || source.endsWith(".xls")) {
    throw new Error("Export that spreadsheet as CSV, then upload the CSV.");
  }
  if (source.endsWith(".tsv")) return parseTsv(text);
  return parseCsv(text);
}

function parseTsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split("\t").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}
