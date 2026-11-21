import assert from "node:assert/strict";
import test from "node:test";
import { isHighVolume, isUpsellSku } from "@/lib/sources/leads-model";

test("upsell catalog keeps cans and drink mixes and drops flakes and extract", () => {
  assert.equal(isUpsellSku("FG-01", "12oz can 12 pack"), true);
  assert.equal(isUpsellSku("MIX-1", "Drink mix stick"), true);
  assert.equal(isUpsellSku("FLAKE-1", "Kava flakes 1lb"), false);
  assert.equal(isUpsellSku("EXT-1", "Kava extract 2oz"), false);
});

test("top 30% includes ranks 1 through 3 of 10 and excludes rank 4", () => {
  assert.equal(isHighVolume(1, 10), true);
  assert.equal(isHighVolume(2, 10), true);
  assert.equal(isHighVolume(3, 10), true);
  assert.equal(isHighVolume(4, 10), false);
});

test("a one-account group is high volume", () => {
  assert.equal(isHighVolume(1, 1), true);
});
