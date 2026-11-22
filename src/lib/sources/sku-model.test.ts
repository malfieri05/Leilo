import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseSkuPricelist } from "@/lib/sources/sku/parse-pricelist";

test("the 2026 master pricelist keeps sellable rows and drops the footer", () => {
  const text = readFileSync("fixtures/sku-pricelist-2026.csv", "utf8");
  const parsed = parseSkuPricelist(text);
  const rows = parsed.skuCatalog ?? [];
  assert.ok(rows.length >= 11);
  assert.equal(rows[0]?.effectiveDate, "2026-03-09");
  const raspberry = rows.find((row) => /raspberry hibiscus$/i.test(row.description));
  assert.equal(raspberry?.deliveredUnit, 2.66);
  assert.equal(raspberry?.isFourPack, false);
  assert.equal(raspberry?.category, "RTD cans");
  const fourPack = rows.find((row) => /raspberry hibiscus \(4-pack\)/i.test(row.description));
  assert.equal(fourPack?.isFourPack, true);
  assert.equal(fourPack?.format, "four-pack");
  assert.equal(rows.some((row) => /berry sticks/i.test(row.description)), true);
  assert.equal(rows.some((row) => /inner upc|leilo inc|vendor/i.test(row.description)), false);
  assert.equal(new Set(rows.map((row) => row.catalogKey)).size, rows.length);
});
