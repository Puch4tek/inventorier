import assert from "node:assert/strict";
import { test } from "node:test";
import { createForgotPasswordAction } from "../src/app/forgot-password/action-core.ts";

test("the public response never waits for account lookup or SMTP delivery", async () => {
  const callbacks = [];
  const requests = [];
  let release;
  const pendingMail = new Promise((resolve) => { release = resolve; });
  const action = createForgotPasswordAction({
    getHeaders: async () => new Headers({ "x-real-ip": "192.0.2.1" }),
    schedule: (callback) => callbacks.push(callback),
    requestReset: async (email, context) => {
      requests.push([email, context.headers.get("x-real-ip")]);
      if (email === "known@example.test") await pendingMail;
    },
  });
  for (const email of ["known@example.test", "unknown@example.test"]) {
    const form = new FormData();
    form.set("email", email);
    assert.deepEqual(await action({}, form), { submitted: true });
  }
  assert.equal(requests.length, 0);
  const delivery = callbacks[0]();
  await callbacks[1]();
  assert.deepEqual(requests, [["known@example.test", "192.0.2.1"], ["unknown@example.test", "192.0.2.1"]]);
  release();
  await delivery;
});
