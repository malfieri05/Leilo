import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parsePromoCalendar } from "@/lib/sources/promo/parse-calendar";

test("the KEHE calendar unpivots month cells and keeps UNFI", () => {
  const parsed = parsePromoCalendar(readFileSync("fixtures/promo-calendar-kehe-2025-2027.csv", "utf8"));
  const events = parsed.promoEvents ?? [];
  assert.ok(events.length >= 40);
  assert.equal(new Set(events.map((event) => event.eventKey)).size, events.length);
  const kehe = events.filter((event) => event.account === "KeHE");
  assert.ok(kehe.some((event) => event.monthLabel === "Apr 2025"));
  const cancelled = kehe.find((event) => event.monthLabel === "Jun 2026");
  assert.equal(cancelled?.status, "cancelled");
  const sprouts = events.find((event) => event.account.startsWith("Sprouts") && event.monthLabel === "Jan 2026");
  assert.equal(sprouts?.startDate, "2025-12-31");
  assert.equal(sprouts?.endDate, "2026-01-27");
  const unfi = events.find((event) => event.account === "UNFI");
  assert.equal(unfi?.channel, "UNFI");
  assert.equal(parsed.promoSnapshot?.rows.some((row) => row.account === "Legend"), false);
});
