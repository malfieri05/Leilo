import { quantity, splitCsv } from "@/lib/sources/fields";
import { recordsFromTable, headerKey, pickColumn } from "@/lib/sources/kehe/columns";
import { keheDcName, normalizeDcCode } from "@/lib/sources/kehe/dc";
import type { KeheInventoryDraft, PullResult } from "@/lib/sources/types";

export function parseKeheStockStatus(text: string): PullResult {
  const table = stockTable(text);
  const headerIndex = findStockHeader(table);
  const rows = recordsFromTable(table, headerIndex);
  const inventory: KeheInventoryDraft[] = [];
  let carriedDc = "";

  for (const row of rows) {
    const dcRaw = pickColumn(row, ["dc", "distribution center", "dc code"]).trim();
    if (dcRaw) carriedDc = dcRaw;
    const dcSource = dcRaw || carriedDc;
    if (!dcSource) continue;
    const dcCode = normalizeDcCode(dcSource);
    const upc = pickColumn(row, ["upc", "sku", "item"]).trim();
    const description = pickColumn(row, ["product description", "description", "item description"]).trim();
    const rowKind = upc ? "sku" : "subtotal";
    inventory.push({
      dcCode,
      dcName: keheDcName(dcCode),
      rowKind,
      upc,
      sku: upc || null,
      description: description || null,
      qtyOnHand: optionalQuantity(pickColumn(row, ["quantity on hand", "qty on hand", "on hand"])),
      qtyOnPo: optionalQuantity(pickColumn(row, ["quantity on purchase order", "qty on po", "quantity on po", "on po"])),
      weeksOnHand: optionalQuantity(pickColumn(row, ["weeks on hand"])),
      weeksOnPo: optionalQuantity(pickColumn(row, ["weeks on po", "weeks on purchase order"])),
      qtyOnSalesOrder: optionalQuantity(pickColumn(row, ["quantity on sales order", "qty on sales order", "on sales order"])),
      vendorCasePack: optionalQuantity(pickColumn(row, ["vendor case pack", "case pack"])),
    });
  }

  return {
    message: `Stored ${inventory.length} KEHE stock rows (${inventory.filter((row) => row.rowKind === "sku").length} SKUs) from the latest Stock Status export.`,
    rowCount: inventory.length,
    accounts: [],
    orders: [],
    shipments: [],
    raw: rows.map((row, index) => ({ kind: "reference" as const, externalId: String(index), payload: row })),
    inventory,
  };
}

function stockTable(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "");
  const sample = cleaned.slice(0, 4000);
  const commas = sample.split(",").length;
  const tabs = sample.split("\t").length;
  if (tabs > commas) {
    return cleaned
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => line.split("\t").map((cell) => cell.trim()));
  }
  return splitCsv(cleaned);
}

function optionalQuantity(value: string) {
  if (!value.trim()) return null;
  return quantity(value);
}

export function findStockHeader(table: string[][]) {
  const limit = Math.min(table.length, 20);
  for (let index = 0; index < limit; index += 1) {
    const joined = table[index].map(headerKey).join(" ");
    if (joined.includes("weeks on hand") && /\bdc\b/.test(joined)) return index;
  }
  return 0;
}
