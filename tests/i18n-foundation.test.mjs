import assert from "node:assert/strict";
import { test } from "node:test";
import { persistLocaleCookie } from "../src/i18n/cookie.ts";
import { resolveLocale } from "../src/i18n/locale.ts";

test("a valid locale cookie takes precedence over Accept-Language", () => {
  assert.equal(
    resolveLocale({ cookie: "pl", acceptLanguage: "en-US,en;q=0.9" }),
    "pl",
  );
});

test("an explicit locale overrides the request preference for background callers", () => {
  assert.equal(
    resolveLocale({
      explicitLocale: "en",
      cookie: "pl",
      acceptLanguage: "pl",
    }),
    "en",
  );
});

test("an invalid cookie is ignored and regional language preferences are matched", () => {
  assert.equal(
    resolveLocale({ cookie: "de", acceptLanguage: "fr;q=1,en-GB;q=0.8" }),
    "en",
  );
});

test("Accept-Language quality values determine preference order", () => {
  assert.equal(
    resolveLocale({ acceptLanguage: "pl;q=0.3,en;q=0.8" }),
    "en",
  );
});

test("q=0 excludes a supported language even when the wildcard is accepted", () => {
  assert.equal(resolveLocale({ acceptLanguage: "en;q=0,*;q=0.8" }), "pl");
});

test("missing or unsupported preferences safely default to Polish", () => {
  assert.equal(resolveLocale({}), "pl");
  assert.equal(resolveLocale({ acceptLanguage: "fr,de;q=0.8" }), "pl");
});

test("switching locale overwrites the persistent cookie with validated options", () => {
  const jar = new Map([["NEXT_LOCALE", "pl"]]);
  const writes = [];
  const cookieStore = {
    set(name, value, options) {
      writes.push({ name, value, options });
      jar.set(name, value);
    },
  };

  assert.equal(persistLocaleCookie(cookieStore, "en", true), true);
  assert.equal(jar.get("NEXT_LOCALE"), "en");
  assert.deepEqual(writes, [
    {
      name: "NEXT_LOCALE",
      value: "en",
      options: {
        httpOnly: true,
        maxAge: 31_536_000,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    },
  ]);
});

test("the locale cookie is not marked Secure in a local HTTP environment", () => {
  let writtenOptions;
  const cookieStore = {
    set(_name, _value, options) {
      writtenOptions = options;
    },
  };

  persistLocaleCookie(cookieStore, "pl", false);
  assert.equal(writtenOptions.secure, false);
});

test("invalid locale selections do not change the stored cookie", () => {
  const jar = new Map([["NEXT_LOCALE", "pl"]]);
  let writeCount = 0;
  const cookieStore = {
    set(name, value) {
      writeCount += 1;
      jar.set(name, value);
    },
  };

  assert.equal(persistLocaleCookie(cookieStore, "en-US", false), false);
  assert.equal(writeCount, 0);
  assert.equal(jar.get("NEXT_LOCALE"), "pl");
});
