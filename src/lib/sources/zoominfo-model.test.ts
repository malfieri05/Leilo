import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountsFromHits } from "@/lib/sources/connectors/zoominfo/search";
import {
  DEFAULT_ZOOMINFO_INDUSTRY_KEYWORDS,
  zoomInfoCompanyNameSearches,
  zoomInfoIndustrySearches,
} from "@/lib/sources/zoominfo-model";

describe("ZoomInfo model", () => {
  it("maps search hits into prospect accounts", () => {
    const accounts = accountsFromHits([
      {
        id: "344589814",
        attributes: {
          name: "Harbor Market",
          city: "Monterey",
          state: "CA",
          address: "123 Main St",
        },
      },
    ]);
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0]?.externalId, "344589814");
    assert.equal(accounts[0]?.customerType, "Prospect");
    assert.equal(accounts[0]?.region, "CA");
    assert.match(accounts[0]?.address ?? "", /Monterey/);
  });

  it("splits optional search env lists", () => {
    const prevIndustry = process.env.ZOOMINFO_INDUSTRY_KEYWORDS;
    const prevNames = process.env.ZOOMINFO_COMPANY_NAMES;
    try {
      process.env.ZOOMINFO_INDUSTRY_KEYWORDS = "kava bar, natural grocer";
      process.env.ZOOMINFO_COMPANY_NAMES = "Kaviva, Recess";
      assert.deepEqual(zoomInfoIndustrySearches(), ["kava bar", "natural grocer"]);
      assert.deepEqual(zoomInfoCompanyNameSearches(), ["Kaviva", "Recess"]);
    } finally {
      if (prevIndustry === undefined) delete process.env.ZOOMINFO_INDUSTRY_KEYWORDS;
      else process.env.ZOOMINFO_INDUSTRY_KEYWORDS = prevIndustry;
      if (prevNames === undefined) delete process.env.ZOOMINFO_COMPANY_NAMES;
      else process.env.ZOOMINFO_COMPANY_NAMES = prevNames;
    }
    assert.ok(DEFAULT_ZOOMINFO_INDUSTRY_KEYWORDS.length >= 2);
  });
});