import assert from "node:assert/strict";
import { test } from "node:test";
import { getCategoryActionErrorKey } from "../src/app/categories/action-errors.ts";
import { getLocationActionErrorKey } from "../src/app/locations/action-errors.ts";

test("known category failures map to safe translated message keys", () => {
  assert.equal(
    getCategoryActionErrorKey(new Error("Category has items and cannot be deleted")),
    "hasItems",
  );
  assert.equal(
    getCategoryActionErrorKey(new Error("Category not found")),
    "notFound",
  );
});

test("known location hierarchy failures map to translated message keys", () => {
  assert.equal(
    getLocationActionErrorKey(new Error("A location cannot be its own parent")),
    "parentSelf",
  );
  assert.equal(
    getLocationActionErrorKey(new Error("This change would create a location cycle")),
    "cycle",
  );
  assert.equal(
    getLocationActionErrorKey(new Error("Location has items or children")),
    "hasItemsOrChildren",
  );
});

test("unknown service exceptions are not exposed as public error text", () => {
  assert.equal(
    getCategoryActionErrorKey(new Error("database credentials leaked")),
    undefined,
  );
  assert.equal(
    getLocationActionErrorKey(new Error("database credentials leaked")),
    undefined,
  );
  assert.equal(getLocationActionErrorKey("unexpected failure"), undefined);
});
