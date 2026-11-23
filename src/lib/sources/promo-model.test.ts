import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { syncMessageForFeed } from "@/lib/sources/google-sheet-feeds";
import { valuesToCsv } from "@/lib/sources/google-sheets/sheet-values";
import { parsePromoCalendar } from "@/lib/sources/promo/parse-calendar";
import { splitCsv } from "@/lib/sources/fields";

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

test("sync messages split per Google Sheet feed", () => {
  const message =
    'Promotion calendar: synced tab "KEHE" (108 promotion cells). SKU and price list: 42 rows stored as reference data.';
  assert.equal(
    syncMessageForFeed(message, "Promotion calendar"),
    'Promotion calendar: synced tab "KEHE" (108 promotion cells).',
  );
  assert.equal(syncMessageForFeed(message, "SKU and price list"), "SKU and price list: 42 rows stored as reference data.");
});

test("Google sheet grids round-trip through valuesToCsv", () => {
  const fixture = readFileSync("fixtures/promo-calendar-kehe-2025-2027.csv", "utf8");
  const fromFile = parsePromoCalendar(fixture);
  const fromGrid = parsePromoCalendar(valuesToCsv(splitCsv(fixture)));
  assert.equal(fromGrid.promoEvents?.length, fromFile.promoEvents?.length);
});
