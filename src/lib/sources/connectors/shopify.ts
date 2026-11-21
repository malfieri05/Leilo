import { blankToNull } from "@/lib/sources/fields";
import { emptyPull } from "@/lib/sources/persist";
import { classifyShopifyWholesaleOrder } from "@/lib/sources/revenue-classification";
import type { PullResult } from "@/lib/sources/types";

const API_VERSION = "2026-10";
/** 250 orders/page; loop until Shopify stops sending `next` (~62 pages for 15k orders). */
const PAGE_LIMIT = 80;

type ShopifyOrder = {
  id: number;
  name?: string;
  created_at?: string;
  processed_at?: string | null;
  cancelled_at?: string | null;
  total_price?: string;
  currency?: string;
  tags?: string;
  note?: string | null;
  line_items?: {
    sku?: string | null;
    title?: string;
    quantity?: number;
    price?: string;
  }[];
  shipping_address?: { address1?: string; city?: string; province_code?: string; zip?: string };
  customer?: { id?: number; first_name?: string; last_name?: string; email?: string };
};

export async function pullShopify(): Promise<PullResult> {
  const shop = shopHost(process.env.SHOPIFY_SHOP ?? "");
  const clientId = process.env.SHOPIFY_CLIENT_ID ?? "";
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET ?? "";
  const token = await accessToken(shop, clientId, clientSecret);
  const orders = await listOrders(shop, token);
  const result = emptyPull("");

  for (const order of orders) {
    const tags = (order.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const classification = classifyShopifyWholesaleOrder({
      tags,
      note: order.note ?? null,
      orderName: order.name ?? null,
      cancelled: Boolean(order.cancelled_at),
    });
    const account = accountFrom(order);
    if (account) result.accounts.push(account);
    const shipDate = (order.processed_at || order.created_at || "").slice(0, 10) || null;
    const revenue = classification.countsInRevenue ? numberOrNull(order.total_price) : 0;
    result.orders.push({
      externalId: String(order.id),
      accountExternalId: account?.externalId ?? null,
      orderingMethod: classification.orderingMethod,
      direction: classification.direction,
      shipDate,
      revenue: order.cancelled_at ? 0 : revenue,
      currency: blankToNull(order.currency),
      tags: tags.join(", "),
      excludeFromDirect: classification.excludeFromDirect,
      partner: "",
      lines: (order.line_items ?? []).map((line) => ({
        sku: blankToNull(line.sku),
        productType: blankToNull(line.title),
        quantity: line.quantity ?? null,
        revenue:
          line.price !== undefined && line.quantity !== undefined && Number.isFinite(Number(line.price))
            ? Number(line.price) * line.quantity
            : null,
      })),
    });
    result.raw.push({
      kind: "sale",
      externalId: String(order.id),
      payload: order,
    });
  }

  const heldOut = result.orders.filter((order) => order.excludeFromDirect).length;
  const review = result.orders.filter((order) => order.orderingMethod === "Unclassified").length;
  const nonRevenue = result.orders.filter((order) => !order.revenue || order.revenue <= 0).length;
  result.rowCount = result.orders.length;
  result.message = `Shopify returned ${result.orders.length} orders. ${heldOut} are held out of Direct, ${review} unclassified for review, ${nonRevenue} excluded from revenue (cancelled or sample/POS/merch tags).`;
  return result;
}

function accountFrom(order: ShopifyOrder) {
  const customer = order.customer;
  if (!customer?.id) return null;
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email;
  if (!name) return null;
  const address = order.shipping_address;
  return {
    externalId: String(customer.id),
    name,
    address: blankToNull(
      [address?.address1, address?.city, address?.province_code, address?.zip].filter(Boolean).join(", "),
    ),
    region: blankToNull(address?.province_code),
    industryType: null,
    customerType: null,
    orderingMethod: null,
  };
}

async function accessToken(shop: string, clientId: string, clientSecret: string) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Shopify refused the client credentials (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(`Shopify token request failed (${response.status}).`);
  }
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("Shopify did not return an access token.");
  return body.access_token;
}

async function listOrders(shop: string, token: string) {
  const orders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;
  for (let page = 0; page < PAGE_LIMIT; page += 1) {
    const url = new URL(`https://${shop}/admin/api/${API_VERSION}/orders.json`);
    url.searchParams.set("limit", "250");
    if (pageInfo) url.searchParams.set("page_info", pageInfo);
    else url.searchParams.set("status", "any");
    const response = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Shopify refused the order read (${response.status}).`);
    }
    if (!response.ok) throw new Error(`Shopify orders request failed (${response.status}).`);
    const body = (await response.json()) as { orders?: ShopifyOrder[] };
    orders.push(...(body.orders ?? []));
    pageInfo = nextPage(response.headers.get("link"));
    if (!pageInfo) break;
  }
  return orders;
}

function nextPage(link: string | null) {
  if (!link) return null;
  const part = link.split(",").find((piece) => piece.includes('rel="next"'));
  return part?.match(/page_info=([^&>]+)/)?.[1] ?? null;
}

function shopHost(shop: string) {
  const host = shop.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!host) throw new Error("SHOPIFY_SHOP is empty.");
  return host.includes(".") ? host : `${host}.myshopify.com`;
}

function numberOrNull(value: string | undefined) {
  if (value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
