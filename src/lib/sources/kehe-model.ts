import { productFamily } from "@/lib/sources/sales-overview-model";

/** One POD is one retailer paired with one SKU. */
export function countPods(pairs: { accountId: string | null; sku: string | null }[]) {
  const keys = new Set<string>();
  for (const pair of pairs) {
    const sku = pair.sku?.trim() ?? "";
    if (!pair.accountId || !sku) continue;
    keys.add(`${pair.accountId}|${sku}`);
  }
  return keys.size;
}

/** Cases shipped divided by cases ordered. Null when the file did not report orders. */
export function fillRate(shipped: number, ordered: number) {
  if (!(ordered > 0)) return null;
  return shipped / ordered;
}

export function industryBucket(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || "Needs a type";
}

/** Cans and drink mixes. Flakes and extract stay off the upsell list. */
export function isKeheUpsellSku(sku: string | null, title: string | null) {
  const family = productFamily(sku, title);
  return family === "RTDs/Cans" || family === "Unmapped";
}
