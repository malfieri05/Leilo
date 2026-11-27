import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeAccountName } from "@/lib/sources/fields";

describe("normalizeAccountName", () => {
  it("trims, collapses whitespace, and strips trailing punctuation", () => {
    assert.equal(normalizeAccountName("  Hi Ho   Market.  "), "Hi Ho Market");
    assert.equal(normalizeAccountName(""), "");
    assert.equal(normalizeAccountName(null), "");
  });
});