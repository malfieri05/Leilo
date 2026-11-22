import { blankToNull, isoDate, plusDays, pick, stableId } from "@/lib/sources/fields";
import type { ShipmentDraft } from "@/lib/sources/types";

/** Weston’s Kehe tab: only Shopify-style B2B names, not bare B- transfer ids. */
export function isKeheLtlOrderId(value: string) {
  return value.trim().startsWith("#B-");
}

export function ltlShipmentsFromRecords(records: Record<string, string>[]): ShipmentDraft[] {
  const shipments: ShipmentDraft[] = [];
  for (const record of records) {
    const orderId = orderIdFrom(record);
    if (!isKeheLtlOrderId(orderId)) continue;
    const statusText = pick(record, ["status"]);
    const delivered = /\bdelivered\b/i.test(statusText);
    const shipDate = isoDate(pick(record, ["ship", "ship date"]));
    const tracking = usable(pick(record, ["tracking"]));
    const pro = usable(pick(record, ["pro"]));
    const bol = usable(pick(record, ["bol"]));
    const trackingUrl = tracking && /^https?:/i.test(tracking) ? tracking : null;
    const trackingNumber = trackingUrl ? pro ?? bol : tracking ?? pro ?? bol;
    shipments.push({
      externalId: stableId(["ltl", orderId]),
      orderExternalId: orderId,
      status: delivered ? "delivered" : "in_transit",
      deliveredAt: delivered && shipDate ? shipDate : null,
      carrier: blankToNull(usable(pick(record, ["carrier", "scac"]))),
      trackingNumber,
      trackingUrl,
      destination: blankToNull(usable(pick(record, ["to", "destination"]))),
      relevantUntil: delivered && shipDate ? plusDays(shipDate, 21) : null,
    });
  }
  return shipments;
}

function orderIdFrom(record: Record<string, string>) {
  const named = pick(record, ["order #", "order number", "order"]);
  const raw = named || Object.values(record)[0] || "";
  return raw.split("\n")[0]?.trim() ?? "";
}

function usable(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^n\/a$/i.test(trimmed)) return null;
  return trimmed;
}
