import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchSalesToShipTo, normalizeAccountName } from "@/lib/sources/sales-to-registry";

describe("matchSalesToShipTo", () => {
  it("normalizes punctuation", () => {
    assert.equal(normalizeAccountName("  Gold Coast — Distribution  "), "gold coast distribution");
  });

  it("matches national distributors", () => {
    const kehe = matchSalesToShipTo("KEHE Distributors", null);
    assert.equal(kehe?.orderingMethod, "KEHE");
  });

  it("prefers shipping company over customer", () => {
    const hit = matchSalesToShipTo("Random Retailer", "Craft Collective Homegrown");
    assert.equal(hit?.orderingMethod, "DSD");
    assert.equal(hit?.partnerSlug, "craft-collective");
  });
});