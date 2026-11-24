import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { partnerSlugFromFolderName } from "@/lib/sources/connectors/dsd-drive";

describe("DSD Drive folders", () => {
  it("maps partner folder names to slugs", () => {
    assert.equal(partnerSlugFromFolderName("Gold Coast"), "gold-coast");
    assert.equal(partnerSlugFromFolderName("INFD (formerly SMNR)"), "infd");
    assert.equal(partnerSlugFromFolderName("LAD - Los Angeles Distributing"), "lad");
    assert.equal(partnerSlugFromFolderName("Alabev (AL)"), "alabev");
  });
});