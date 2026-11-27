import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hubspotResolvedIndustryType, normalizeAccountName } from "@/lib/sources/fields";

describe("hubspotResolvedIndustryType", () => {
  it("prefers industry_type over standard industry", () => {
    assert.equal(hubspotResolvedIndustryType({ industry_type: "Kava Bars", industry: "FOOD_BEVERAGES" }), "Kava Bars");
    assert.equal(hubspotResolvedIndustryType({ industry_type: "  ", industry: "Retail" }), "Retail");
    assert.equal(hubspotResolvedIndustryType({ industry_type: null, industry: null }), null);
  });
});

describe("normalizeAccountName", () => {
  it("trims, collapses whitespace, and strips trailing punctuation", () => {
    assert.equal(normalizeAccountName("  Hi Ho   Market.  "), "Hi Ho Market");
    assert.equal(normalizeAccountName(""), "");
    assert.equal(normalizeAccountName(null), "");
  });
});