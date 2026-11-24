import assert from "node:assert/strict";
import test from "node:test";
import { recordsFromPowerTabsGrid } from "@/lib/sources/spins/parse-powertabs-grid";
import { normalizeSpinsRow } from "@/lib/sources/spins-model";

test("PowerTabs brand rank grid maps dollars and brand", () => {
  const grid = [
    ["PowerTabs Export - Brand Rank"],
    ["Period: 12 W/E 11/1/26"],
    [],
    ["Brands", "Dollars", "Units"],
    ["Leilo", "120000", "5000"],
    ["Hiyo", "80000", "3000"],
  ];
  const rows = recordsFromPowerTabsGrid(grid);
  assert.equal(rows?.length, 2);
  const leilo = normalizeSpinsRow(rows![0], { reportKind: "brand-rank", periodWeeks: 12 });
  assert.equal(leilo.brand, "Leilo");
  assert.equal(leilo.dollars, 120000);
  assert.equal(leilo.units, 5000);
});