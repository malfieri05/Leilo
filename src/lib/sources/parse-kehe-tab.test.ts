import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { splitCsv } from "@/lib/sources/fields";
import { isKeheLtlOrderId, ltlShipmentsFromRecords } from "@/lib/sources/ltl/parse-kehe-tab";
import { POS_TAG_REGEX, SAMPLE_TAG_REGEX } from "@/lib/sources/revenue-classification";

function records(text: string) {
  const table = splitCsv(text);
  const headers = table[0] ?? [];
  return table.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

describe("Kehe LTL tab", () => {
  it("keeps #B- orders and drops bare B- ids", () => {
    const text = readFileSync("fixtures/ltl-kehe-sample.csv", "utf8");
    const shipments = ltlShipmentsFromRecords(records(text));
    const ids = shipments.map((row) => row.orderExternalId);
    assert.deepEqual(ids, ["#B-3335", "#B-9001"]);
    assert.equal(isKeheLtlOrderId("B-1155"), false);
    assert.equal(isKeheLtlOrderId("#B-3335"), true);
  });

  it("stores the tracking URL and a 21-day window after a delivered ship date", () => {
    const text = readFileSync("fixtures/ltl-kehe-sample.csv", "utf8");
    const shipments = ltlShipmentsFromRecords(records(text));
    const delivered = shipments.find((row) => row.orderExternalId === "#B-3335");
    assert.equal(delivered?.status, "delivered");
    assert.equal(delivered?.deliveredAt, "2023-09-01");
    assert.equal(delivered?.relevantUntil, "2023-09-22");
    assert.equal(delivered?.trackingUrl, "https://www.fedex.com/fedextrack/?trknbr=773288690610");
    assert.equal(delivered?.trackingNumber, "773288690610");
    assert.equal(delivered?.destination, "OTD");

    const open = shipments.find((row) => row.orderExternalId === "#B-9001");
    assert.equal(open?.status, "in_transit");
    assert.equal(open?.deliveredAt, null);
    assert.equal(open?.relevantUntil, null);
    assert.equal(open?.trackingNumber, "0492517466");
  });
});

describe("tracking tags", () => {
  it("matches sample and POS as whole tags", () => {
    const sample = new RegExp(SAMPLE_TAG_REGEX, "i");
    const pos = new RegExp(POS_TAG_REGEX, "i");
    assert.match("sample", sample);
    assert.match("POS, merch", pos);
    assert.doesNotMatch("sample", pos);
    assert.doesNotMatch("possible", pos);
    assert.doesNotMatch("sampler", sample);
  });
});
