import assert from "node:assert/strict";
import { test } from "node:test";
import { createEmailActions } from "../src/app/admin/email/action-core.ts";

function fixture(overrides = {}) {
  const calls = [];
  const deps = {
    requireAdmin: async () => ({ id: "admin", sessionId: "session" }),
    save: async (input, actor, session) => calls.push(["save", input, actor, session]),
    consumeTestLimit: async (actor) => { calls.push(["limit", actor]); return true; },
    getConfig: async (actor, session) => { calls.push(["config", actor, session]); return { password: "sekret-konfiguracji" }; },
    sendTest: async (config, to, locale) => { calls.push(["send", config, to, locale]); },
    revalidate: () => calls.push(["revalidate"]),
    settingsError: () => undefined,
    ...overrides,
  };
  return { actions: createEmailActions(deps), calls };
}

function settingsForm() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    host: "smtp.example.org", port: "587", tls: "starttls", username: "user",
    fromEmail: "sender@example.org", fromName: "Sender", password: "", resetExpiryMinutes: "60",
  })) data.set(key, value);
  return data;
}

test("both actions check admin before doing any work", async () => {
  const { actions, calls } = fixture({ requireAdmin: async () => { throw new Error("sekret"); } });
  assert.match((await actions.save({}, settingsForm())).error, /uprawnień/);
  const data = new FormData();
  data.set("to", "test@example.org");
  assert.match((await actions.send({}, data)).error, /uprawnień/);
  assert.deepEqual(calls, []);
});

test("saving preserves an empty password, ignores clear requests and validates bounds", async () => {
  const { actions, calls } = fixture();
  const data = settingsForm();
  assert.ok((await actions.save({}, data)).success);
  assert.equal(calls[0][1].password, undefined);
  assert.ok(!("clearPassword" in calls[0][1]));
  assert.equal(calls[0][2], "admin");
  assert.equal(calls[0][3], "session");
  data.set("clearPassword", "on");
  assert.ok((await actions.save({}, data)).success);
  assert.ok(calls.every((call) => !("clearPassword" in (call[1] ?? {}))));
  data.delete("clearPassword");
  data.set("password", "new-secret");
  assert.ok((await actions.save({}, data)).success);
  assert.equal(calls.find((call) => call[1]?.password)[1].password, "new-secret");
  data.set("password", "");
  data.set("resetExpiryMinutes", "14");
  assert.ok((await actions.save({}, data)).error);
  data.set("resetExpiryMinutes", "1441");
  assert.ok((await actions.save({}, data)).error);
  data.set("resetExpiryMinutes", "15");
  data.set("port", "1e2");
  assert.ok((await actions.save({}, data)).error);
  assert.equal(calls.filter((call) => call[0] === "save").length, 3);
});

test("test email is limited before accessing saved settings or sending", async () => {
  const data = new FormData();
  data.set("to", " test@example.org ");
  const blocked = fixture({ consumeTestLimit: async () => false });
  assert.ok((await blocked.actions.send({}, data)).error);
  assert.deepEqual(blocked.calls, []);
  const allowed = fixture();
  assert.ok((await allowed.actions.send({}, data)).success);
  assert.deepEqual(allowed.calls.map(([name]) => name), ["limit", "config", "send"]);
  assert.deepEqual(allowed.calls[1], ["config", "admin", "session"]);
  assert.equal(allowed.calls[2][2], "test@example.org");
  assert.equal(allowed.calls[2][3], "pl");
  data.set("to", "test@example.org\r\nBcc: victim@example.org");
  assert.ok((await allowed.actions.send({}, data)).error);
  assert.equal(allowed.calls.length, 3);
});

test("test email uses the request locale for its action result and message", async () => {
  const { actions, calls } = fixture();
  const data = new FormData();
  data.set("to", "test@example.org");

  const result = await actions.send({}, data, "en");

  assert.equal(result.success, "The test email has been sent.");
  assert.equal(calls.find(([name]) => name === "send")[3], "en");
});

test("unexpected errors cannot disclose SMTP secrets and limiter failures fail closed", async () => {
  const secret = "sekret-123";
  const data = new FormData();
  data.set("to", "test@example.org");
  for (const overrides of [
    { save: async () => { throw new Error(secret); } },
    { consumeTestLimit: async () => { throw new Error(secret); } },
    { sendTest: async () => { throw new Error(secret); } },
  ]) {
    const { actions } = fixture(overrides);
    const result = overrides.save ? await actions.save({}, settingsForm()) : await actions.send({}, data);
    assert.ok(result.error);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(secret));
  }
});
