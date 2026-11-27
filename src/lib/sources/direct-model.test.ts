import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countPods } from "@/lib/sources/kehe-model";
import {
  directOrderPredicate,
  distributorIndustryPredicate,
  isDirectDistributorIndustry,
  resolvedCustomerType,
  resolvedIndustryType,
  warehouseAccountSql,
} from "@/lib/sources/direct-model";

describe("Direct industry", () => {
  it("treats Independent and Regional Distributor as out of Direct", () => {
    assert.equal(isDirectDistributorIndustry("Independent Distributor"), true);
    assert.equal(isDirectDistributorIndustry(" regional distributor "), true);
    assert.equal(isDirectDistributorIndustry("Independent Grocery"), false);
    assert.match(distributorIndustryPredicate(), /independent distributor/);
    assert.match(distributorIndustryPredicate(), /regional distributor/);
    assert.match(directOrderPredicate("$3"), /ordering_method = 'Direct'/);
    assert.match(directOrderPredicate("$3"), /NOT \(lower/);
  });

  it("uses the Shopify type, then HubSpot, then Needs a type", () => {
    assert.equal(resolvedIndustryType("Smoke Shop", "Grocery"), "Smoke Shop");
    assert.equal(resolvedIndustryType("  ", "Kava Bars"), "Kava Bars");
    assert.equal(resolvedIndustryType(null, "  "), "Needs a type");
  });

  it("uses the Shopify customer type, then HubSpot type", () => {
    assert.equal(resolvedCustomerType("Prospect", "Mature Customer"), "Prospect");
    assert.equal(resolvedCustomerType(null, "Past Customer"), "Past Customer");
    assert.equal(resolvedCustomerType("", ""), "");
  });

  it("drops warehouse names only outside Nationwide", () => {
    assert.equal(warehouseAccountSql("nationwide"), "");
    assert.match(warehouseAccountSql("california"), /kehe/);
    assert.match(warehouseAccountSql("southeast"), /unfi/);
  });
});

describe("Direct PODs", () => {
  it("counts one retailer and SKU once", () => {
    assert.equal(
      countPods([
        { accountId: "a", sku: "FG-01-RH" },
        { accountId: "a", sku: "FG-01-RH" },
        { accountId: "a", sku: "FG-01-BO" },
        { accountId: null, sku: "FG-01-BO" },
      ]),
      2,
    );
  });
});
