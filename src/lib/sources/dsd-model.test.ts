import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dsdLineRevenue, dsdThroughPredicate, partnerFilterSql } from "@/lib/sources/dsd-model";
import { normalizePartnerName, partnerLabel } from "@/lib/sources/dsd/partners";

describe("DSD pricing", () => {
  it("keeps shipped dollars", () => {
    assert.equal(dsdLineRevenue({ dollars: 40, cases: 2, units: null, sku: "can", title: "Raspberry" }), 40);
  });

  it("prices sticks and cans when dollars are missing", () => {
    assert.equal(dsdLineRevenue({ dollars: null, cases: null, units: 4, sku: "STK-1", title: "Kava stick" }), 6);
    assert.equal(dsdLineRevenue({ dollars: null, cases: 1, units: null, sku: "FG-01", title: "Raspberry can" }), 35.88);
    assert.equal(
      dsdLineRevenue({ dollars: null, cases: 1, units: null, sku: "4PK", title: "Raspberry 4-pack" }),
      71.76,
    );
  });
});

describe("DSD partners", () => {
  it("maps aliases onto one slug", () => {
    assert.equal(normalizePartnerName("Gold Coast"), "gold-coast");
    assert.equal(normalizePartnerName("SMNR"), "infd");
    assert.equal(normalizePartnerName("MexCor"), "mexcor");
    assert.equal(partnerLabel("gold-coast"), "Gold Coast");
  });

  it("keeps through-partner orders separate from Shopify invoices", () => {
    assert.match(dsdThroughPredicate(), /direction = 'through'/);
    assert.match(dsdThroughPredicate(), /source IN \('dsd', 'encompass'\)/);
    const params: unknown[] = [];
    assert.equal(partnerFilterSql(null, params), "");
    assert.match(partnerFilterSql("gold-coast", params), /o\.partner = \$1/);
    assert.deepEqual(params, ["gold-coast"]);
  });
});
