import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDays,
  assignTiers,
  parseSalesQuery,
  productFamily,
  regionStates,
  resolvePeriod,
  shiftYears,
} from "@/lib/sources/sales-overview-model";

describe("resolvePeriod", () => {
  it("uses year to date through today, compared with the same dates last year", () => {
    const { period } = parseSalesQuery({}, new Date("2026-11-21T20:00:00Z"));
    assert.equal(period.key, "ytd");
    assert.equal(period.from, "2026-01-01");
    assert.equal(period.to, "2026-11-21");
    assert.equal(period.compareFrom, "2025-01-01");
    assert.equal(period.compareTo, "2025-11-21");
  });

  it("uses the calendar month for month to date", () => {
    const period = resolvePeriod(
      { region: "nationwide", range: "mtd", from: null, to: null, segment: "industry", segmentValue: "", cohort: null, partner: null },
      "2026-11-21",
    );
    assert.equal(period.from, "2026-11-01");
    assert.equal(period.to, "2026-11-21");
    assert.equal(period.compareFrom, "2025-11-01");
    assert.equal(period.compareTo, "2025-11-21");
  });

  it("clamps a leap day when shifting back a year", () => {
    assert.equal(shiftYears("2024-02-29", -1), "2023-02-28");
    const period = resolvePeriod(
      { region: "nationwide", range: "ytd", from: null, to: null, segment: "industry", segmentValue: "", cohort: null, partner: null },
      "2024-02-29",
    );
    assert.equal(period.compareTo, "2023-02-28");
  });

  it("drops the comparison for all time and swaps an inverted custom range", () => {
    const all = resolvePeriod(
      { region: "nationwide", range: "all", from: null, to: null, segment: "industry", segmentValue: "", cohort: null, partner: null },
      "2026-11-21",
    );
    assert.equal(all.from, null);
    assert.equal(all.compareFrom, null);

    const custom = resolvePeriod(
      {
        region: "nationwide",
        range: "custom",
        from: "2026-06-01",
        to: "2026-03-01",
        segment: "industry",
        segmentValue: "",
        cohort: null,
        partner: null,
      },
      "2026-11-21",
    );
    assert.equal(custom.from, "2026-03-01");
    assert.equal(custom.to, "2026-06-01");
    assert.equal(custom.compareFrom, "2025-03-01");
    assert.equal(custom.compareTo, "2025-06-01");
  });

  it("falls back to year to date when a custom range is incomplete", () => {
    const { query, period } = parseSalesQuery({ range: "custom", from: "2026-01-01" }, new Date("2026-11-21T20:00:00Z"));
    assert.equal(query.range, "ytd");
    assert.equal(period.from, "2026-01-01");
  });
});

describe("region and product family", () => {
  it("lists California and the Southeast, and leaves nationwide unfiltered", () => {
    assert.deepEqual(regionStates("california"), ["CA"]);
    assert.deepEqual(regionStates("southeast"), ["FL", "GA", "SC", "NC", "MS", "TN", "AL"]);
    assert.equal(regionStates("nationwide"), null);
  });

  it("maps line text onto the four families and leaves stick packs unmapped", () => {
    assert.equal(productFamily("FG-12-RH", "Raspberry Hibiscus"), "RTDs/Cans");
    assert.equal(productFamily("FG-72-RH", "Raspberry Hibiscus (72-Pack)"), "RTDs/Cans");
    assert.equal(productFamily("FG-04-LLCP", "Single Carton (4-Pack)"), "RTDs/Cans");
    assert.equal(productFamily(null, "12 oz tonic"), "RTDs/Cans");
    assert.equal(productFamily("KV-FLAKE", "Kava Flakes"), "Kava Flakes");
    assert.equal(productFamily(null, "Kava extract powder"), "Kava Powders");
    assert.equal(productFamily(null, "Noble Kava Extract"), "Kava Extract");
    assert.equal(productFamily("FG-10-LEMON-STICK", "Lemon Lime stick"), "Unmapped");
    assert.equal(productFamily("FG-48-RLX-2OZ", "Kava Relax Shot (48 Bottles)"), "Unmapped");
    assert.equal(productFamily(null, null), "Unmapped");
  });

  it("counts a 90 day window back from today", () => {
    assert.equal(addDays("2026-11-21", -90), "2026-08-23");
  });
});

describe("assignTiers", () => {
  it("places each account by the revenue share already counted above it", () => {
    const accounts = Array.from({ length: 20 }, (_, index) => ({
      id: String(index + 1),
      name: `Account ${String(index + 1).padStart(2, "0")}`,
      revenue: 5,
    }));
    const bands = assignTiers(accounts);
    assert.deepEqual(
      bands.map((band) => band.accounts.length),
      [1, 1, 3, 5, 10],
    );
    assert.equal(bands[0].accounts[0].name, "Account 01");
    assert.equal(bands[4].label, "The other half");
    assert.equal(bands[0].share, 0.05);
    assert.equal(bands[4].share, 0.5);
  });

  it("keeps a single large account in the top band", () => {
    const bands = assignTiers([
      { id: "a", name: "Big", revenue: 80 },
      { id: "b", name: "Small", revenue: 20 },
    ]);
    assert.equal(bands[0].accounts[0].name, "Big");
    assert.equal(bands[4].accounts[0].name, "Small");
    assert.equal(bands[1].accounts.length, 0);
  });
});
