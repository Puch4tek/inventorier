import assert from "node:assert/strict";
import { test } from "node:test";
import { generateBarcode } from "../src/server/items/generate-barcode.ts";

test("generated barcodes use the I- prefix and preserve the six-character suffix", () => {
  assert.match(generateBarcode(), /^I-[A-F0-9]{6}$/);
});
