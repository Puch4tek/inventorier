import assert from "node:assert/strict";
import { test } from "node:test";
import { getAdminActionError } from "../src/i18n/admin-errors.ts";

test("known user and warehouse errors are localized without forwarding raw server text", () => {
  assert.equal(
    getAdminActionError(new Error("Nie możesz usunąć własnego konta."), "en", "deleteUser"),
    "You cannot delete your own account.",
  );
  assert.equal(
    getAdminActionError(new Error("Nie można usunąć ostatniego magazynu."), "en", "deleteWarehouse"),
    "The last warehouse cannot be deleted.",
  );
});

test("unexpected errors use a translated safe fallback", () => {
  const secret = "internal database details";
  const message = getAdminActionError(new Error(secret), "en", "createWarehouse");
  assert.equal(message, "The warehouse could not be created.");
  assert.doesNotMatch(message, new RegExp(secret));
  assert.equal(
    getAdminActionError(new Error(secret), "pl", "createWarehouse"),
    "Nie udało się utworzyć magazynu.",
  );
});
