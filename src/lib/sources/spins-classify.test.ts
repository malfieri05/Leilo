import assert from "node:assert/strict";
import test from "node:test";
import { classifySpinsDriveFile } from "@/lib/sources/spins/classify-drive-file";

test("SPINS Drive filenames map to report and weeks", () => {
  const item12 = classifySpinsDriveFile("SPINS Item Rank 12 week");
  assert.equal(item12?.reportKind, "item-rank");
  assert.equal(item12?.periodWeeks, 12);

  const brand4 = classifySpinsDriveFile("SPINS 4 week Rolling");
  assert.equal(brand4?.reportKind, "brand-rank");
  assert.equal(brand4?.periodWeeks, 4);

  const sprouts = classifySpinsDriveFile("Sprouts item matrix 52 week");
  assert.equal(sprouts?.reportKind, "sprouts-matrix");
  assert.equal(sprouts?.periodWeeks, 52);

  const arkBrand = classifySpinsDriveFile("11-1-26 brand rank 12 week");
  assert.equal(arkBrand?.reportKind, "brand-rank");
  assert.equal(arkBrand?.periodWeeks, 12);

  const truncated = classifySpinsDriveFile("11-1-26 brand rank 4");
  assert.equal(truncated?.reportKind, "brand-rank");
  assert.equal(truncated?.periodWeeks, 4);

  assert.equal(classifySpinsDriveFile("Investor Spins summary"), null);
  assert.equal(classifySpinsDriveFile("SPINS Data 7/12/26"), null);
});