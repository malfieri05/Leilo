import assert from "node:assert/strict";
import test from "node:test";
import {
  includedInSpinsView,
  isLeiloBrand,
  matchesCompetitorSet,
  normalizeBrandName,
  spinsPartnerSlug,
} from "@/lib/sources/spins-model";

test("4-packs and items under $2,000 stay out of SPINS views", () => {
  assert.equal(includedInSpinsView({ Brand: "Leilo", "Dollar Sales": "$2,500", Item: "12oz can" }), true);
  assert.equal(includedInSpinsView({ Brand: "Leilo", "Dollar Sales": "$1,500", Item: "12oz can" }), false);
  assert.equal(includedInSpinsView({ Brand: "Leilo 4-pack", "Dollar Sales": "$9,000" }), false);
});

test("competitor names normalize and match the SPINS set", () => {
  assert.equal(normalizeBrandName("Edna’s"), "ednas");
  assert.equal(matchesCompetitorSet("hiyo"), true);
  assert.equal(matchesCompetitorSet("Edna's"), true);
  assert.equal(matchesCompetitorSet("Leilo"), false);
  assert.equal(isLeiloBrand("Leilo"), true);
  assert.equal(isLeiloBrand("Hiyo"), false);
});

test("a report and week window become the connection slug", () => {
  assert.equal(spinsPartnerSlug("brand-rank", 12), "brand-rank:12w");
  assert.equal(spinsPartnerSlug("sprouts-matrix", 4), "sprouts-matrix:4w");
});
