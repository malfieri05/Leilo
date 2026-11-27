import { blankToNull, isoDate, normalizeAccountName, orderingMethodFromText, saleDirection } from "@/lib/sources/fields";
import { emptyPull } from "@/lib/sources/persist";
import type { PullResult } from "@/lib/sources/types";

const COMPANY_PROPERTIES = [
  "name",
  "industry_type",
  "type",
  "customer_type",
  "ordering_method",
  "address",
  "city",
  "state",
];

type HubSpotPage = {
  results?: {
    id: string;
    properties?: Record<string, string | null>;
  }[];
  paging?: { next?: { after?: string } };
};

export async function pullHubSpot(): Promise<PullResult> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN ?? "";
  const companies = await listObjects(token, "companies", COMPANY_PROPERTIES);
  const result = emptyPull("");

  for (const company of companies.rows) {
    const properties = company.properties ?? {};
    const name = blankToNull(normalizeAccountName(properties.name));
    if (!name) continue;
    const methodText = properties.ordering_method;
    result.accounts.push({
      externalId: company.id,
      name,
      address: blankToNull([properties.address, properties.city, properties.state].filter(Boolean).join(", ")),
      region: blankToNull(properties.state),
      industryType: blankToNull(properties.industry_type),
      customerType: blankToNull(properties.type) ?? blankToNull(properties.customer_type),
      orderingMethod: blankToNull(methodText),
    });
    result.raw.push({ kind: "reference", externalId: company.id, payload: company });
  }

  let orderNote = "HubSpot orders were not available on this portal.";
  try {
    const orders = await listObjects(token, "orders", [
      "hs_order_name",
      "hs_total_price",
      "hs_currency_code",
      "hs_external_order_id",
      "hs_createdate",
    ]);
    for (const order of orders.rows) {
      const properties = order.properties ?? {};
      const method = orderingMethodFromText(properties.ordering_method);
      const { direction, excludeFromDirect } = saleDirection(method, "api");
      const created = properties.hs_createdate ?? "";
      result.orders.push({
        externalId: properties.hs_external_order_id || order.id,
        accountExternalId: null,
        orderingMethod: method,
        direction,
        shipDate: isoDate(created),
        revenue: numberOrNull(properties.hs_total_price),
        currency: blankToNull(properties.hs_currency_code),
        tags: "",
        excludeFromDirect,
        partner: "",
        lines: [],
      });
      result.raw.push({ kind: "sale", externalId: order.id, payload: order });
    }
    orderNote = `HubSpot returned ${orders.rows.length} orders.`;
  } catch (error) {
    orderNote = error instanceof Error ? error.message : "HubSpot orders could not be read.";
  }

  result.rowCount = result.accounts.length + result.orders.length;
  const industryNote = companies.droppedIndustry
    ? " industry_type, type, or ordering_method is not a company property yet, so those fields were left blank."
    : " Industry Type from industry_type; Customer Type from type (not the default Industry field).";
  result.message = `HubSpot returned ${result.accounts.length} companies. ${orderNote}${industryNote}`;
  return result;
}

async function listObjects(token: string, object: string, properties: string[]) {
  const rows: NonNullable<HubSpotPage["results"]> = [];
  let droppedIndustry = false;
  let after: string | null = null;
  let activeProperties = properties;

  for (let page = 0; page < 200; page += 1) {
    const url = new URL(`https://api.hubapi.com/crm/v3/objects/${object}`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("properties", activeProperties.join(","));
    if (after) url.searchParams.set("after", after);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`HubSpot refused the ${object} read (${response.status}).`);
    }
    if (response.status === 400 && activeProperties.some((name) => name === "industry_type")) {
      droppedIndustry = true;
      activeProperties = ["name", "address", "city", "state"];
      page -= 1;
      continue;
    }
    if (response.status === 404 || response.status === 403) {
      throw new Error(`HubSpot ${object} are not available (${response.status}).`);
    }
    if (!response.ok) throw new Error(`HubSpot ${object} request failed (${response.status}).`);
    const body = (await response.json()) as HubSpotPage;
    rows.push(...(body.results ?? []));
    after = body.paging?.next?.after ?? null;
    if (!after) break;
  }

  return { rows, droppedIndustry };
}

function numberOrNull(value: string | null | undefined) {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
