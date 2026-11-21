import { productFamily } from "@/lib/sources/sales-overview-model";

/** Cans and drink mixes. Flakes and extract stay off the upsell list. */
export function isUpsellSku(sku: string | null, title: string | null) {
  const family = productFamily(sku, title);
  return family === "RTDs/Cans" || family === "Unmapped";
}

/** Rank is 1-based. A single-account group is a display-shipper opportunity. */
export function isHighVolume(rank: number, groupSize: number) {
  if (groupSize === 1) return rank === 1;
  if (rank < 1 || groupSize < 1) return false;
  return rank / groupSize <= 0.3;
}

/** Equal revenue shares a rank. The next lower revenue takes the following place number. */
export function competitionRanks(revenues: number[]) {
  const ranks: number[] = [];
  let rank = 1;
  for (let index = 0; index < revenues.length; index += 1) {
    if (index > 0 && revenues[index] < revenues[index - 1]) rank = index + 1;
    ranks.push(rank);
  }
  return ranks;
}
