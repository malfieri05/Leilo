import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import { NON_REVENUE_TAG_REGEX, type SaleClassification } from "@/lib/sources/revenue-classification";
import { REVENUE_ORDER_SOURCE } from "@/lib/sources/revenue";

export type OrderRow = {
  externalId: string;
  accountName: string | null;
  orderingMethod: string;
  direction: string;
  shipDate: string | null;
  revenue: number | null;
  tags: string;
  excludeFromDirect: boolean;
};

export type OrderList =
  | { state: "no-database" }
  | { state: "empty"; total: number }
  | { state: "error"; message: string }
  | { state: "ready"; rows: OrderRow[]; total: number };

export async function listShopifyOrders(input: { excluded: boolean; limit?: number }): Promise<OrderList> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const directPredicate = input.excluded
      ? sql`NOT (
          o.ordering_method = 'Direct'
          AND o.direction = 'direct'
          AND o.exclude_from_direct = false
          AND o.revenue > 0
          AND NOT (o.tags ~* ${NON_REVENUE_TAG_REGEX})
        )`
      : sql`(
          o.ordering_method = 'Direct'
          AND o.direction = 'direct'
          AND o.exclude_from_direct = false
          AND o.revenue > 0
          AND NOT (o.tags ~* ${NON_REVENUE_TAG_REGEX})
        )`;

    const [countRows, rows] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS count
        FROM orders o
        WHERE o.organization_id = ${organizationId}
          AND o.source = ${REVENUE_ORDER_SOURCE}
          AND ${directPredicate}
      `,
      sql`
        SELECT
          o.external_id,
          a.name AS account_name,
          o.ordering_method,
          o.direction,
          o.ship_date::text AS ship_date,
          o.revenue,
          o.tags,
          o.exclude_from_direct
        FROM orders o
        LEFT JOIN accounts a ON a.id = o.account_id
        WHERE o.organization_id = ${organizationId}
          AND o.source = ${REVENUE_ORDER_SOURCE}
          AND ${directPredicate}
        ORDER BY o.ship_date DESC NULLS LAST, o.external_id
        LIMIT ${limit}
      `,
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    if (total === 0) return { state: "empty", total: 0 };
    return {
      state: "ready",
      total,
      rows: rows.map((row) => ({
        externalId: String(row.external_id),
        accountName: blank(row.account_name),
        orderingMethod: String(row.ordering_method),
        direction: String(row.direction),
        shipDate: blank(row.ship_date),
        revenue: row.revenue === null || row.revenue === undefined ? null : Number(row.revenue),
        tags: String(row.tags ?? ""),
        excludeFromDirect: Boolean(row.exclude_from_direct),
      })),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export function exclusionReason(order: OrderRow) {
  if (!order.revenue || order.revenue <= 0) return "Cancelled or non-revenue";
  if (order.orderingMethod === "Unclassified") return "Needs review";
  if (order.orderingMethod !== "Direct") return `${order.orderingMethod} tag`;
  if (/distributor/i.test(order.tags)) return "Distributor tag";
  return "Held out of Direct";
}

export function classificationReviewLabel(classification: Pick<SaleClassification, "reviewReason" | "nonRevenueReason">) {
  return classification.reviewReason ?? classification.nonRevenueReason;
}

function blank(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}