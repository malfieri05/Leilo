import { blankToNull, orderingMethodFromText, saleDirection } from "@/lib/sources/fields";
import { emptyPull } from "@/lib/sources/persist";
import type { PullResult } from "@/lib/sources/types";

const API_VERSION = "2026-10";
const PAGE_LIMIT = 10;

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
    const blob = `${tags.join(" ")} ${order.note ?? ""}`;
    const method = orderingMethodFromText(blob);
    const markedDistributor = method !== "Direct" || /distributor/i.test(blob);
    const placed = saleDirection(method, "api");
    const direction = markedDistributor ? "to" : placed.direction;
    const excludeFromDirect = markedDistributor;
    const account = accountFrom(order);
    if (account) result.accounts.push(account);
    const shipDate = (order.processed_at || order.created_at || "").slice(0, 10) || null;
    result.orders.push({
      externalId: String(order.id),
      accountExternalId: account?.externalId ?? null,
      orderingMethod: method,
      direction,
      shipDate,
      revenue: order.cancelled_at ? 0 : numberOrNull(order.total_price),
      currency: blankToNull(order.currency),
      tags: tags.join(", "),
      excludeFromDirect,
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

  const distributorOrders = result.orders.filter((order) => order.excludeFromDirect).length;
  result.rowCount = result.orders.length;
  result.message = `Shopify returned ${result.orders.length} orders. ${distributorOrders} are marked so Direct totals can leave them out. Tags sample, POS, and merch stay on the order.`;
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
