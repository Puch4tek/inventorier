import assert from "node:assert/strict";
import { test } from "node:test";
import { localizeItemActionError } from "../src/lib/items/action-errors.ts";
import {
  getItemHistoryMessageKey,
  itemHistoryDescriptions,
} from "../src/lib/items/history.ts";

test("known item errors are localized while unknown exception details stay private", () => {
  const translate = (key) => `localized:${key}`;

  assert.equal(
    localizeItemActionError(
      new Error("Przedmiot nie istnieje"),
      "fallback",
      translate,
    ),
    "localized:errors.itemNotFound",
  );
  assert.equal(
    localizeItemActionError(
      new Error("database credentials leaked"),
      "fallback",
      translate,
    ),
    "fallback",
  );
});

test("new history identifiers resolve to distinct viewer-language messages", () => {
  assert.equal(
    getItemHistoryMessageKey(
      itemHistoryDescriptions.nameChanged,
      "ITEM_UPDATED",
    ),
    "history.nameChanged",
  );
  assert.equal(
    getItemHistoryMessageKey(
      itemHistoryDescriptions.descriptionChanged,
      "ITEM_UPDATED",
    ),
    "history.descriptionChanged",
  );
  assert.equal(
    getItemHistoryMessageKey(
      itemHistoryDescriptions.categoryChanged,
      "ITEM_UPDATED",
    ),
    "history.categoryChanged",
  );
});

test("legacy history descriptions are returned to the UI unchanged", () => {
  assert.equal(
    getItemHistoryMessageKey("Zmieniono nazwę", "ITEM_UPDATED"),
    undefined,
  );
});

test("history rows without descriptions fall back to translated event types", () => {
  assert.equal(
    getItemHistoryMessageKey(null, "QUANTITY_CHANGED"),
    "history.types.quantityChanged",
  );
  assert.equal(getItemHistoryMessageKey(null, "ITEM_ARCHIVED"), "history.types.itemArchived");
  assert.equal(getItemHistoryMessageKey(null, "UNKNOWN_EVENT"), undefined);
});
