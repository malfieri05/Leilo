import { splitCsv } from "@/lib/sources/fields";
import { parseSkuPricelistTable } from "@/lib/sources/sku-model";
import type { PullResult } from "@/lib/sources/types";

export function parseSkuPricelist(text: string): PullResult {
  const { effectiveDate, catalog } = parseSkuPricelistTable(splitCsv(text.replace(/^\uFEFF/, "")));
  if (catalog.length === 0) {
    throw new Error("The pricelist has a header, but no Leilo product rows.");
  }
  const fourPacks = catalog.filter((row) => row.isFourPack).length;
  const when = effectiveDate ? ` effective ${effectiveDate}` : "";
  return {
    message: `Stored ${catalog.length} SKUs from the master list${when}. ${fourPacks} are 4-packs.`,
    rowCount: catalog.length,
    accounts: [],
    orders: [],
    shipments: [],
    skuCatalog: catalog,
    raw: [
      {
        kind: "reference",
        externalId: effectiveDate ? `master:${effectiveDate}` : "master",
        payload: { effectiveDate, count: catalog.length, fourPacks },
      },
    ],
  };
}

export function skuPartnerSlug(effectiveDate: string | null) {
  return effectiveDate ? `master:${effectiveDate}` : "master";
}
