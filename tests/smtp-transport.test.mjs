import assert from "node:assert/strict";
import { test } from "node:test";
import nodemailer from "nodemailer";
import {
  sendMail,
  sendPasswordResetEmail,
  sendTestEmail,
} from "../src/server/email/send-mail.ts";
import { sendEmailVerificationMail } from "../src/server/email/email-verification-mail.ts";

const config = {
  host: "smtp.example.test",
  port: 465,
  tls: "implicit",
  username: "user",
  password: "secret-password",
  fromEmail: "mail@example.test",
  fromName: "Załoga <magazynu>",
};

function stubTransport(t, sendMail = async () => ({})) {
  const calls = [];
  t.mock.method(nodemailer, "createTransport", (options) => {
    const sent = [];
    calls.push({ options, sent });
    return {
      sendMail: async (message) => {
        sent.push(message);
        return sendMail(message);
      },
    };
  });
  return calls;
}

test("uses a fresh, verified TLS transport and preserves the message and sender", async (t) => {
  const calls = stubTransport(t);
  const message = { to: "user@example.test", subject: "Temat", text: "Treść", html: "<p>Treść</p>" };
  await sendMail(config, message);
  await sendMail({ ...config, tls: "starttls", port: 587, password: "new-password" }, message);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].options, {
    host: config.host,
    port: 465,
    secure: true,
    requireTLS: false,
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    auth: { user: config.username, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  assert.equal(calls[1].options.secure, false);
  assert.equal(calls[1].options.requireTLS, true);
  assert.equal(calls[1].options.auth.pass, "new-password");
  assert.deepEqual(calls[0].sent[0], {
    from: { name: config.fromName, address: config.fromEmail },
    ...message,
  });
  await assert.rejects(sendMail({ ...config, tls: "off" }, message), /tryb zabezpieczenia/);
  assert.equal(calls.length, 2);
});

test("sends a Polish test message", async (t) => {
  const calls = stubTransport(t);
  await sendTestEmail(config, "recipient@example.test");
  const message = calls[0].sent[0];
  assert.equal(message.to, "recipient@example.test");
  assert.match(message.subject, /Test/);
  assert.match(message.text, /wiadomość testowa/);
  assert.match(message.html, /wiadomość testowa/);
});

test("renders reset, verification, and test email in the requested language", async (t) => {
  const calls = stubTransport(t);
  const resetUrl = "https://example.test/reset?token=sample";
  await sendPasswordResetEmail(config, "recipient@example.test", resetUrl, "en");
  await sendEmailVerificationMail(
    config,
    "recipient@example.test",
    "https://example.test/verify?token=sample",
    "en",
  );
  await sendTestEmail(config, "recipient@example.test", "en");

  assert.match(calls[0].sent[0].subject, /Reset your password/);
  assert.match(calls[0].sent[0].text, /We received a request/);
  assert.match(calls[0].sent[0].html, /Set a new password/);
  assert.match(calls[1].sent[0].subject, /Confirm your email address/);
  assert.match(calls[1].sent[0].html, /Confirm email address/);
  assert.match(calls[2].sent[0].subject, /Mail configuration test/);
  assert.match(calls[2].sent[0].text, /This is a test message/);
});

test("escapes the reset link in HTML while keeping the plain text link intact", async (t) => {
  const calls = stubTransport(t);
  const url = `https://example.test/reset?token=abc&next="'<tag>`;
  await sendPasswordResetEmail(config, "recipient@example.test", url);
  const message = calls[0].sent[0];
  assert.equal(message.to, "recipient@example.test");
  assert.match(message.subject, /hasła/);
  assert.ok(message.text.includes(url));
  assert.ok(message.html.includes("abc&amp;next=&quot;&#39;&lt;tag&gt;"));
  assert.ok(!message.html.includes(url));

  for (const invalid of ["javascript:alert(1)", "https://user:pass@example.test/", "https://example.test/\nreset", "not a URL"]) {
    await assert.rejects(sendPasswordResetEmail(config, "recipient@example.test", invalid), /Nieprawidłowy adres/);
  }
  assert.equal(calls.length, 1);
});

test("propagates SMTP errors without logging credentials or links", async (t) => {
  const failure = new Error("SMTP failure containing secret-password and reset-token");
  stubTransport(t, async () => { throw failure; });
  const logs = [];
  for (const method of ["log", "warn", "error", "info", "debug"]) {
    t.mock.method(console, method, (...args) => logs.push(args));
  }
  await assert.rejects(
    sendPasswordResetEmail(config, "recipient@example.test", "https://example.test/?token=reset-token"),
    (error) => error === failure,
  );
  assert.deepEqual(logs, []);
});
