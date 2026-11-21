import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keheDcName } from "@/lib/sources/kehe/dc";
import { parseKeheSalesFile, parseKeheSalesThrough } from "@/lib/sources/kehe/parse-sales-through";
import { findStockHeader, parseKeheStockStatus } from "@/lib/sources/kehe/parse-stock-status";
import { countPods, fillRate, industryBucket, isKeheUpsellSku } from "@/lib/sources/kehe-model";
import { classifyKeheStockRow, stockIntegrityWarnings } from "@/lib/sources/kehe-stock-flags";
import { splitCsv } from "@/lib/sources/fields";
import { parseSalesQuery } from "@/lib/sources/sales-overview-model";

describe("classifyKeheStockRow", () => {
  it("uses the strictest combined-weeks tier", () => {
    assert.equal(flag({ weeksOnHand: 1, weeksOnPo: 1 }), "red");
    assert.equal(flag({ weeksOnHand: 2, weeksOnPo: 2 }), "orange");
    assert.equal(flag({ weeksOnHand: 3, weeksOnPo: 3 }), "yellow");
    assert.equal(flag({ weeksOnHand: 4, weeksOnPo: 4 }), "none");
  });

  it("flags a green SKU only when weeks and sales-order demand both clear", () => {
    const green = classifyKeheStockRow({
      rowKind: "sku",
      qtyOnHand: 90,
      qtyOnPo: 0,
      weeksOnHand: 9,
      weeksOnPo: 0,
      qtyOnSalesOrder: 30,
    });
    assert.equal(green.flag, "green");
    assert.equal(green.nearMiss, false);
    assert.match(green.note ?? "", /weeks of implied run rate/);

    const miss = classifyKeheStockRow({
      rowKind: "sku",
      qtyOnHand: 70,
      qtyOnPo: 0,
      weeksOnHand: 7,
      weeksOnPo: 0,
      qtyOnSalesOrder: 30,
    });
    assert.equal(miss.flag, "none");
    assert.equal(miss.nearMiss, true);
  });

  it("does not paint a DC subtotal green", () => {
    const painted = classifyKeheStockRow({
      rowKind: "subtotal",
      qtyOnHand: 90,
      qtyOnPo: 0,
      weeksOnHand: 9,
      weeksOnPo: 0,
      qtyOnSalesOrder: 30,
    });
    assert.equal(painted.flag, "none");
    assert.equal(painted.nearMiss, false);
  });

  it("separates a true stockout from a reporting gap", () => {
    const stockout = classifyKeheStockRow({
      rowKind: "sku",
      qtyOnHand: 0,
      qtyOnPo: 0,
      weeksOnHand: 0,
      weeksOnPo: 0,
      qtyOnSalesOrder: 4,
    });
    assert.equal(stockout.flag, "red");
    assert.match(stockout.note ?? "", /True stockout/);

    const gap = classifyKeheStockRow({
      rowKind: "sku",
      qtyOnHand: 12,
      qtyOnPo: 0,
      weeksOnHand: 0,
      weeksOnPo: 0,
      qtyOnSalesOrder: 0,
    });
    assert.equal(gap.reportingGap, true);
    assert.match(gap.note ?? "", /Reporting gap/);
  });
});

describe("stock integrity", () => {
  it("flags a DC subtotal that does not match its SKUs", () => {
    const warnings = stockIntegrityWarnings({
      rows: [
        row("01", "", "subtotal", 10),
        row("01", "111", "sku", 4),
        row("01", "222", "sku", 4),
      ],
    });
    assert.equal(warnings.some((warning) => warning.code === "subtotal"), true);
  });
});

describe("KEHE counts", () => {
  it("counts a POD once per retailer and SKU", () => {
    assert.equal(
      countPods([
        { accountId: "a", sku: "FG-01-RH" },
        { accountId: "a", sku: "FG-01-RH" },
        { accountId: "a", sku: "FG-01-BO" },
        { accountId: "b", sku: "  " },
        { accountId: null, sku: "FG-01-BO" },
      ]),
      2,
    );
  });

  it("leaves fill rate empty when cases ordered are missing", () => {
    assert.equal(fillRate(8, 0), null);
    assert.equal(fillRate(8, 10), 0.8);
    assert.equal(industryBucket("  "), "Needs a type");
    assert.equal(industryBucket("Kava Bars"), "Kava Bars");
  });

  it("keeps cans and drink mixes on the upsell list", () => {
    assert.equal(isKeheUpsellSku("FG-01-RH", "Raspberry Hibiscus can"), true);
    assert.equal(isKeheUpsellSku("MIX-01", "Vanilla drink mix"), true);
    assert.equal(isKeheUpsellSku("FLK-01", "Kava flakes"), false);
    assert.equal(isKeheUpsellSku("EXT-01", "Kava extract"), false);
  });

  it("uses the same year-to-date window as Sales Overview", () => {
    const parsed = parseSalesQuery({ range: "ytd", region: "southeast" }, new Date("2026-11-21T20:00:00Z"));
    assert.equal(parsed.query.region, "southeast");
    assert.equal(parsed.period.from, "2026-01-01");
    assert.equal(parsed.period.to, parsed.today);
    assert.equal(parsed.period.compareFrom, "2025-01-01");
  });
});

describe("KEHE parsers", () => {
  it("prefers shipped dollars and keeps cases for fill rate", () => {
    const parsed = parseKeheSalesThrough([
      {
        Chain: "Harbor Market",
        State: "CA",
        "Ship Date": "2026-02-01",
        UPC: "FG-01-RH",
        "Product Description": "Raspberry Hibiscus",
        "Cases Ordered": "10",
        "Cases Shipped": "8",
        "Shipped Dollars": "250.50",
      },
    ]);
    assert.equal(parsed.orders[0]?.revenue, 250.5);
    assert.equal(parsed.orders[0]?.lines[0]?.casesOrdered, 10);
    assert.equal(parsed.orders[0]?.lines[0]?.casesShipped, 8);
    assert.equal(parsed.accounts[0]?.region, "CA");
  });

  it("prices cases at $2.66 per can when dollars are missing", () => {
    const parsed = parseKeheSalesThrough([
      { Store: "Elm St", State: "FL", Date: "2026-03-01", SKU: "FG-01-BO", "Cases Shipped": "1" },
    ]);
    assert.equal(parsed.orders[0]?.revenue, 31.92);
    assert.equal(parsed.orders[0]?.lines[0]?.casesOrdered, null);
  });

  it("finds the stock header after the Connect preamble", () => {
    const csv = [
      "KEHE Connect",
      "Stock Status",
      "Enterprise Supplier,Leilo",
      "Brand,Leilo",
      "Generated,2026-11-01",
      "DC,UPC,Product Description,Vendor Case Pack,Quantity On Hand,Quantity On Purchase Order,Weeks on Hand,Weeks on PO,Quantity on Sales Order",
      "01,,DC total,,20,0,2,0,0",
      "01,00850001,Raspberry Hibiscus,12,20,0,2,0,0",
    ].join("\n");
    const header = findStockHeader(splitCsv(csv));
    assert.equal(header, 5);
    const parsed = parseKeheStockStatus(csv);
    assert.equal(parsed.inventory?.length, 2);
    assert.equal(parsed.inventory?.[1]?.dcName, "St. Augustine");
    assert.equal(parsed.inventory?.[1]?.qtyOnHand, 20);
    assert.equal(keheDcName("55"), "Douglasville");
    assert.equal(keheDcName("Chino A, CA"), "Chino");
  });

  it("carries the DC name down onto the SKU rows beneath it", () => {
    const csv = [
      "Inventory Stock Status",
      'Enterprise Supplier,Brand,,DC,UPC,Product Description,Vendor Case Pack,Quantity On Hand,Quantity On Purchase Order,Weeks on Hand,Weeks on PO,Quantity on Sales Order',
      'LEILO INC,,,,,,,100,0,1,0,0',
      ',,,"Aurora, CO",,,,3216,2652,4,3,24',
      ",,,,850031385009,KAVA PINA COLADA RTD 12.00 FO,12,684,864,3,4,0",
      ',,,"St. Augustine, FL",,,,100,0,9,0,0',
      ",,,,860003308257,KAVA RASP HIBISCUS RTD 12.00 FO,12,20,0,9,0,4",
    ].join("\n");
    const parsed = parseKeheStockStatus(csv);
    const skus = parsed.inventory?.filter((row) => row.rowKind === "sku") ?? [];
    assert.equal(skus.length, 2);
    assert.equal(skus[0]?.dcCode, "12");
    assert.equal(skus[0]?.dcName, "Aurora");
    assert.equal(skus[0]?.qtyOnHand, 684);
    assert.equal(skus[1]?.dcCode, "01");
  });

  it("turns a monthly sales pivot into one shipment per store, SKU, and month", () => {
    const csv = [
      ",,,,,Year",
      ",,,,,2025,,2026",
      "RETAILER NAME,RETAILER AREA,MAIN STORE,SUB STORE,SKU,Jan,Feb,Jan",
      'ACI,Nor Cal,Andronico\'s,"SAFEWAY #173 - MONTEREY, CA",12 FO KAVA PINA COLADA RTD (850031385009),$31.92,,$63.84',
      ',,,"SAFEWAY #173 - MONTEREY, CA Total",,$95.76,,',
    ].join("\n");
    const parsed = parseKeheSalesFile(csv);
    assert.equal(parsed.accounts.length, 1);
    assert.equal(parsed.accounts[0]?.region, "CA");
    assert.equal(parsed.orders.length, 2);
    assert.equal(parsed.orders[0]?.lines[0]?.sku, "850031385009");
    assert.equal(parsed.orders[0]?.shipDate, "2025-01-01");
    assert.equal(parsed.orders[0]?.revenue, 31.92);
    assert.equal(parsed.orders[1]?.shipDate, "2026-01-01");
    assert.equal(parsed.orders[1]?.revenue, 63.84);
    assert.equal(parsed.orders[0]?.lines[0]?.casesOrdered, null);
  });
});

function flag(input: { weeksOnHand: number; weeksOnPo: number }) {
  return classifyKeheStockRow({
    rowKind: "sku",
    qtyOnHand: 10,
    qtyOnPo: 0,
    weeksOnHand: input.weeksOnHand,
    weeksOnPo: input.weeksOnPo,
    qtyOnSalesOrder: 0,
  }).flag;
}

function row(dcCode: string, upc: string, rowKind: "sku" | "subtotal", qtyOnHand: number) {
  return {
    rowKind,
    dcCode,
    upc,
    qtyOnHand,
    qtyOnPo: 0,
    weeksOnHand: 4,
    weeksOnPo: 0,
    qtyOnSalesOrder: 0,
  };
}
