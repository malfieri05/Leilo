import { isoDate, money } from "@/lib/sources/fields";
import { productFamily } from "@/lib/sources/sales-overview-model";
import type { SkuCatalogDraft } from "@/lib/sources/types";

export const SKU_CATEGORIES = ["RTD cans", "Powder", "Other"] as const;
export type SkuCategory = (typeof SKU_CATEGORIES)[number];

const COL = {
  brand: 0,
  itemNumber: 1,
  keheEsn: 2,
  unitUpc: 3,
  caseUpc: 4,
  gtin: 5,
  ranking: 6,
  description: 7,
  innerPack: 8,
  masterPack: 9,
  unitSize: 10,
  fobUnit: 11,
  fobInner: 12,
  fobCase: 13,
  deliveredUnit: 14,
  deliveredInner: 15,
  deliveredCase: 16,
  dsdUnit: 17,
  dsdInner: 18,
  dsdCase: 19,
  msrp: 20,
} as const;

export function isFourPack(description: string) {
  return /4\s*-?\s*pack/i.test(description);
}

export function productFamilyFromSku(description: string, unitSize: string | null) {
  return productFamily(null, `${description} ${unitSize ?? ""}`);
}

export function categoryFromLabel(label: string): SkuCategory {
  const text = label.trim().toLowerCase();
  if (text.includes("rtd") || text.includes("can")) return "RTD cans";
  if (text.includes("powder") || text.includes("stick")) return "Powder";
  return "Other";
}

export function isSkuProductRow(brand: string, description: string, unitUpc: string) {
  return brand.trim().toLowerCase() === "leilo" && Boolean(description.trim() || unitUpc.trim());
}

export function parseSkuPricelistTable(rows: string[][]) {
  const headerIndex = rows.findIndex(
    (row) => cell(row, COL.brand).toLowerCase() === "brand" && row.some((value) => /item number/i.test(value)),
  );
  if (headerIndex < 0) {
    throw new Error("That file is not a Leilo master pricelist. Expected a Brand and Item Number header.");
  }
  const header = rows[headerIndex].map((value) => value.replace(/\s+/g, " ").trim().toLowerCase());
  if (!header[COL.keheEsn]?.includes("kehe") || !header[COL.fobUnit]?.includes("fob")) {
    throw new Error("The pricelist header does not match the 2026 master list layout.");
  }

  let effectiveDate: string | null = null;
  for (const row of rows.slice(0, headerIndex)) {
    const found = row.join(" ").match(/effective date\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (found) effectiveDate = isoDate(found[1]);
  }

  let category: SkuCategory = "Other";
  const catalog: SkuCatalogDraft[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const brand = cell(row, COL.brand);
    if (/^vendor$/i.test(brand) || /remittance/i.test(brand)) break;
    const description = cell(row, COL.description);
    const unitUpc = cell(row, COL.unitUpc);
    if (isSkuProductRow(brand, description, unitUpc)) {
      catalog.push(toDraft(row, category, effectiveDate));
      continue;
    }
    if (brand && !description && !unitUpc) category = categoryFromLabel(brand);
  }
  return { effectiveDate, catalog };
}

function toDraft(row: string[], category: SkuCategory, effectiveDate: string | null): SkuCatalogDraft {
  const description = cell(row, COL.description).replace(/\s+/g, " ").trim();
  const unitSize = blank(cell(row, COL.unitSize));
  const gtin = blank(cell(row, COL.gtin));
  const unitUpc = blank(cell(row, COL.unitUpc));
  const fourPack = isFourPack(description);
  const format = fourPack ? "four-pack" : category === "Powder" || /stick/i.test(description) ? "stick" : "single";
  return {
    catalogKey: catalogKey(gtin, unitUpc, description),
    effectiveDate,
    category,
    itemNumber: blank(cell(row, COL.itemNumber)),
    keheEsn: blank(cell(row, COL.keheEsn)),
    unitUpc,
    caseUpc: blank(cell(row, COL.caseUpc)),
    gtin,
    ranking: integer(cell(row, COL.ranking)),
    description,
    innerPack: blank(cell(row, COL.innerPack)),
    masterPack: integer(cell(row, COL.masterPack)),
    unitSize,
    fobUnit: price(cell(row, COL.fobUnit)),
    fobInner: price(cell(row, COL.fobInner)),
    fobCase: price(cell(row, COL.fobCase)),
    deliveredUnit: price(cell(row, COL.deliveredUnit)),
    deliveredInner: price(cell(row, COL.deliveredInner)),
    deliveredCase: price(cell(row, COL.deliveredCase)),
    dsdUnit: price(cell(row, COL.dsdUnit)),
    dsdInner: price(cell(row, COL.dsdInner)),
    dsdCase: price(cell(row, COL.dsdCase)),
    msrp: price(cell(row, COL.msrp)),
    logistics: logistics(row),
    isFourPack: fourPack,
    format,
    supplementFactsUrl: null,
    payload: row.map((value) => value.trim()),
  };
}

function catalogKey(gtin: string | null, unitUpc: string | null, description: string) {
  const gtinDigits = gtin?.replace(/\D/g, "") ?? "";
  if (gtinDigits.length >= 8) return `gtin:${gtinDigits}`;
  const upcDigits = unitUpc?.replace(/\D/g, "") ?? "";
  if (upcDigits.length >= 8) return `upc:${upcDigits}`;
  return `name:${description.toLowerCase()}`;
}

function logistics(row: string[]) {
  const labels = [
    [21, "unitNetWeight"],
    [22, "innerPackNetWeight"],
    [23, "unitL"],
    [24, "unitW"],
    [25, "unitD"],
    [26, "innerL"],
    [27, "innerW"],
    [28, "innerD"],
    [29, "masterL"],
    [30, "masterW"],
    [31, "masterD"],
    [32, "caseWeight"],
    [33, "caseCube"],
    [34, "pallet"],
    [35, "netPalletWeight"],
    [36, "shelfLife"],
    [37, "dateCoding"],
  ] as const;
  const record: Record<string, string> = {};
  for (const [index, label] of labels) {
    const value = blank(cell(row, index));
    if (value) record[label] = value;
  }
  return record;
}

function cell(row: string[], index: number) {
  return (row[index] ?? "").trim();
}

function blank(value: string) {
  if (!value || /^n\/?a$/i.test(value)) return null;
  return value;
}

function price(value: string) {
  return money(value);
}

function integer(value: string) {
  const amount = money(value);
  return amount === null ? null : Math.trunc(amount);
}
