import { splitCsv } from "@/lib/sources/fields";
import { parsePromoCalendarTable } from "@/lib/sources/promo-model";
import type { PullResult } from "@/lib/sources/types";

export function parsePromoCalendar(text: string): PullResult {
  const { events, snapshot } = parsePromoCalendarTable(splitCsv(text.replace(/^\uFEFF/, "")));
  if (events.length === 0) throw new Error("The calendar has headers, but no promotion cells.");
  const cancelled = events.filter((event) => event.status === "cancelled").length;
  return {
    message: `Stored ${events.length} promotion cells across ${snapshot.rows.length} accounts. ${cancelled} are marked cancelled.`,
    rowCount: events.length,
    accounts: [],
    orders: [],
    shipments: [],
    promoEvents: events,
    promoSnapshot: snapshot,
    raw: [
      {
        kind: "reference",
        externalId: "promo-calendar",
        payload: { title: snapshot.title, accounts: snapshot.rows.length, events: events.length },
      },
    ],
  };
}

export function promoPartnerSlug() {
  return "kehe-unfi";
}
