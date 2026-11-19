import { blankToNull, isoDate, plusDays } from "@/lib/sources/fields";
import { emptyPull } from "@/lib/sources/persist";
import type { PullResult } from "@/lib/sources/types";

type ShipStationShipment = {
  shipmentId?: number;
  orderNumber?: string;
  trackingNumber?: string;
  carrierCode?: string;
  shipDate?: string;
  deliveryDate?: string | null;
  voided?: boolean;
};

export async function pullShipStation(): Promise<PullResult> {
  const key = process.env.SHIPSTATION_API_KEY ?? "";
  const secret = process.env.SHIPSTATION_API_SECRET ?? "";
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const shipments: ShipStationShipment[] = [];

  for (let page = 1; page <= 5; page += 1) {
    const url = new URL("https://ssapi.shipstation.com/shipments");
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("page", String(page));
    const response = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`ShipStation refused the API key (${response.status}).`);
    }
    if (!response.ok) throw new Error(`ShipStation request failed (${response.status}).`);
    const body = (await response.json()) as { shipments?: ShipStationShipment[] };
    const batch = body.shipments ?? [];
    shipments.push(...batch);
    if (batch.length < 100) break;
  }

  const result = emptyPull("");
  let openTracking = 0;
  for (const shipment of shipments) {
    if (shipment.shipmentId === undefined) continue;
    const delivered = shipment.deliveryDate ? isoDate(shipment.deliveryDate) : null;
    const relevantUntil = delivered ? plusDays(delivered, 21) : null;
    if (relevantUntil && relevantUntil >= new Date().toISOString().slice(0, 10)) openTracking += 1;
    const status = shipment.voided ? "voided" : delivered ? "delivered" : "in_transit";
    result.shipments.push({
      externalId: String(shipment.shipmentId),
      orderExternalId: blankToNull(shipment.orderNumber),
      status,
      deliveredAt: shipment.deliveryDate ?? null,
      carrier: blankToNull(shipment.carrierCode),
      trackingNumber: blankToNull(shipment.trackingNumber),
      relevantUntil,
    });
    result.raw.push({
      kind: "shipment",
      externalId: String(shipment.shipmentId),
      payload: shipment,
    });
  }

  result.rowCount = result.shipments.length;
  result.message = `ShipStation returned ${result.shipments.length} shipments. ${openTracking} are still inside the 21 days after delivery.`;
  return result;
}
