import { isB2bOrderId } from "@/lib/sources/fields";
import type { OrderingMethod, SalesDirection } from "@/lib/sources/types";

/** Documented in docs/b2b-sales-context.md (Tracking). Match whole tags case-insensitively. */
export const NON_REVENUE_TAG_NAMES = ["sample", "pos", "merch", "merchandise"] as const;

/**
 * Postgres regex for comma-separated Shopify tags (whole-tag match).
 * Used by revenue SQL and unit tests.
 */
export const NON_REVENUE_TAG_REGEX =
  "(^|,\\s*)(sample|pos|merch|merchandise)(\\s*,|$)";

export type SaleClassification = {
  orderingMethod: OrderingMethod;
  direction: SalesDirection;
  excludeFromDirect: boolean;
  /** False for cancelled orders and documented non-revenue tags. */
  countsInRevenue: boolean;
  reviewReason: string | null;
  nonRevenueReason: string | null;
};

export function classifyShopifyWholesaleOrder(input: {
  tags: string[];
  note: string | null;
  orderName: string | null;
  cancelled: boolean;
}): SaleClassification {
  const blob = buildBlob(input.tags, input.note);
  const nonRevenueReason = nonRevenueTagReason(input.tags);

  if (input.cancelled) {
    return {
      orderingMethod: "Unclassified",
      direction: "direct",
      excludeFromDirect: true,
      countsInRevenue: false,
      reviewReason: "Cancelled order",
      nonRevenueReason: null,
    };
  }

  if (nonRevenueReason) {
    return {
      orderingMethod: "Unclassified",
      direction: "direct",
      excludeFromDirect: true,
      countsInRevenue: false,
      reviewReason: null,
      nonRevenueReason,
    };
  }

  const channel = detectSalesToChannel(blob);
  if (channel) {
    return {
      orderingMethod: channel,
      direction: "to",
      excludeFromDirect: true,
      countsInRevenue: true,
      reviewReason: null,
      nonRevenueReason: null,
    };
  }

  if (/\bdistributor\b/i.test(blob)) {
    return {
      orderingMethod: "Unclassified",
      direction: "to",
      excludeFromDirect: true,
      countsInRevenue: true,
      reviewReason: "Distributor tag without KEHE, UNFI, or DSD channel",
      nonRevenueReason: null,
    };
  }

  if (hasConfidentDirectSignal(input.tags, input.orderName, blob)) {
    return {
      orderingMethod: "Direct",
      direction: "direct",
      excludeFromDirect: false,
      countsInRevenue: true,
      reviewReason: null,
      nonRevenueReason: null,
    };
  }

  return {
    orderingMethod: "Unclassified",
    direction: "direct",
    excludeFromDirect: true,
    countsInRevenue: true,
    reviewReason: "No channel keyword or confident Direct signal",
    nonRevenueReason: null,
  };
}

function buildBlob(tags: string[], note: string | null) {
  return `${tags.join(" ").toLowerCase()} ${(note ?? "").toLowerCase()}`.trim();
}

function detectSalesToChannel(blob: string): Exclude<OrderingMethod, "Direct" | "Unclassified"> | null {
  if (blob.includes("kehe") || blob.includes("ke he")) return "KEHE";
  if (blob.includes("unfi")) return "UNFI";
  if (blob.includes("dsd") || blob.includes("encompass")) return "DSD";
  return null;
}

function hasConfidentDirectSignal(tags: string[], orderName: string | null, blob: string) {
  const tagTokens = tags.map((tag) => tag.trim().toLowerCase());
  if (tagTokens.includes("direct")) return true;
  if (orderName && isB2bOrderId(orderName)) return true;
  if (/\bdirect\b/i.test(blob) && !/\bdistributor\b/i.test(blob)) return true;
  return false;
}

export function nonRevenueTagReason(tags: string[]): string | null {
  for (const raw of tags) {
    const token = raw.trim().toLowerCase();
    if ((NON_REVENUE_TAG_NAMES as readonly string[]).includes(token)) {
      return `Tag: ${raw.trim()}`;
    }
  }
  return null;
}

/** Rows that belong in the Direct wholesale table and Direct revenue KPI. */
export function isCanonicalDirectSale(input: {
  source: string;
  orderingMethod: string;
  direction: string;
  excludeFromDirect: boolean;
  revenue: number | null;
  tags: string;
}): boolean {
  return (
    input.source === "shopify" &&
    input.orderingMethod === "Direct" &&
    input.direction === "direct" &&
    !input.excludeFromDirect &&
    isRevenueEligibleAmount(input.revenue) &&
  !tagsMatchNonRevenue(input.tags)
  );
}

/** Rows held out of Direct (distributor, ambiguous, non-revenue, cancelled). */
export function isHeldOutOfDirect(input: {
  source: string;
  orderingMethod: string;
  excludeFromDirect: boolean;
  direction: string;
  revenue: number | null;
  tags: string;
}): boolean {
  if (input.source !== "shopify") return false;
  return !isCanonicalDirectSale(input);
}

export function isRevenueEligibleAmount(revenue: number | null): boolean {
  return revenue !== null && revenue > 0;
}

export function tagsMatchNonRevenue(tags: string): boolean {
  if (!tags.trim()) return false;
  const parts = tags.split(",").map((tag) => tag.trim().toLowerCase());
  return parts.some((tag) => (NON_REVENUE_TAG_NAMES as readonly string[]).includes(tag));
}

/** Sales Overview: revenue from Leilo to a distributor (not through-retailer). */
export function directionLabel(direction: string): string {
  const labels: Record<string, string> = {
    direct: "Direct",
    to: "To the distributor",
    through: "Through to the retailer",
  };
  return labels[direction] ?? direction;
}