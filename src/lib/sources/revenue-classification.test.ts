import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyShopifyWholesaleOrder,
  isCanonicalDirectSale,
  isHeldOutOfDirect,
  nonRevenueTagReason,
} from "@/lib/sources/revenue-classification";
import { buildKpis, type RevenueRow } from "@/lib/sources/revenue";

describe("classifyShopifyWholesaleOrder", () => {
  it("classifies KEHE by ship-to before tags", () => {
    const shipTo = classifyShopifyWholesaleOrder({
      tags: [],
      note: null,
      orderName: "#B-1001",
      cancelled: false,
      customerName: "KeHE Distributors",
    });
    assert.equal(shipTo.orderingMethod, "KEHE");
    assert.equal(shipTo.partnerSlug, "kehe");
  });

  it("classifies DSD partner from shipping company", () => {
    const result = classifyShopifyWholesaleOrder({
      tags: [],
      note: null,
      orderName: null,
      cancelled: false,
      customerName: "Retail Buyer",
      shippingCompany: "Gold Coast Distribution",
    });
    assert.equal(result.orderingMethod, "DSD");
    assert.equal(result.partnerSlug, "gold-coast");
  });

  it("classifies KEHE as sales to distributor via tag fallback", () => {
    const result = classifyShopifyWholesaleOrder({
      tags: ["KEHE"],
      note: null,
      orderName: "#B-1001",
      cancelled: false,
    });
    assert.equal(result.orderingMethod, "KEHE");
    assert.equal(result.direction, "to");
    assert.equal(result.excludeFromDirect, true);
    assert.equal(result.countsInRevenue, true);
  });

  it("classifies UNFI and DSD", () => {
    const unfi = classifyShopifyWholesaleOrder({
      tags: ["unfi"],
      note: null,
      orderName: null,
      cancelled: false,
    });
    assert.equal(unfi.orderingMethod, "UNFI");
    assert.equal(unfi.direction, "to");

    const dsd = classifyShopifyWholesaleOrder({
      tags: ["dsd"],
      note: null,
      orderName: null,
      cancelled: false,
    });
    assert.equal(dsd.orderingMethod, "DSD");
  });

  it("marks distributor-only tags as unclassified sales-to", () => {
    const result = classifyShopifyWholesaleOrder({
      tags: ["distributor"],
      note: null,
      orderName: "#B-200",
      cancelled: false,
    });
    assert.equal(result.orderingMethod, "Unclassified");
    assert.equal(result.direction, "to");
    assert.equal(result.reviewReason, "Distributor tag without KEHE, UNFI, or DSD channel");
  });

  it("does not treat untagged orders as Direct", () => {
    const result = classifyShopifyWholesaleOrder({
      tags: [],
      note: "",
      orderName: "1005",
      cancelled: false,
    });
    assert.equal(result.orderingMethod, "Unclassified");
    assert.equal(result.excludeFromDirect, true);
    assert.match(result.reviewReason ?? "", /Ship-to|Direct signal/);
  });

  it("treats B2B order names as confident Direct", () => {
    const result = classifyShopifyWholesaleOrder({
      tags: [],
      note: null,
      orderName: "#B-4455",
      cancelled: false,
    });
    assert.equal(result.orderingMethod, "Direct");
    assert.equal(result.direction, "direct");
    assert.equal(result.excludeFromDirect, false);
  });

  it("excludes cancelled orders from revenue", () => {
    const result = classifyShopifyWholesaleOrder({
      tags: ["KEHE"],
      note: null,
      orderName: null,
      cancelled: true,
    });
    assert.equal(result.countsInRevenue, false);
    assert.equal(result.excludeFromDirect, true);
  });

  it("excludes sample, POS, and merch from revenue", () => {
    for (const tag of ["sample", "POS", "merch", "Merchandise"]) {
      const result = classifyShopifyWholesaleOrder({
        tags: [tag],
        note: null,
        orderName: "#B-1",
        cancelled: false,
      });
      assert.equal(result.countsInRevenue, false, tag);
      assert.ok(nonRevenueTagReason([tag]));
    }
  });
});

describe("canonical Direct predicates", () => {
  const directRow = {
    source: "shopify",
    orderingMethod: "Direct",
    direction: "direct",
    excludeFromDirect: false,
    revenue: 100,
    tags: "",
  };

  it("includes canonical Direct", () => {
    assert.ok(isCanonicalDirectSale(directRow));
    assert.ok(!isHeldOutOfDirect(directRow));
  });

  it("holds out ambiguous and distributor rows", () => {
    assert.ok(
      isHeldOutOfDirect({
        ...directRow,
        orderingMethod: "Unclassified",
        excludeFromDirect: true,
      }),
    );
    assert.ok(
      isHeldOutOfDirect({
        ...directRow,
        orderingMethod: "KEHE",
        direction: "to",
        excludeFromDirect: true,
      }),
    );
  });
});

describe("buildKpis alignment", () => {
  it("maps Direct and distributor sales-to separately", () => {
    const rows: RevenueRow[] = [
      {
        orderingMethod: "Direct",
        direction: "direct",
        directionLabel: "Direct",
        orders: 10,
        revenue: 1000,
      },
      {
        orderingMethod: "DSD",
        direction: "to",
        directionLabel: "To the distributor",
        orders: 1,
        revenue: 50,
      },
      {
        orderingMethod: "Unclassified",
        direction: "direct",
        directionLabel: "Direct",
        orders: 2,
        revenue: 200,
      },
    ];
    const kpis = buildKpis(rows);
    assert.equal(kpis.find((kpi) => kpi.label === "Direct")?.revenue, 1000);
    assert.equal(kpis.find((kpi) => kpi.label === "DSD")?.revenue, 50);
    assert.equal(kpis.find((kpi) => kpi.label === "KEHE")?.revenue, 0);
  });
});