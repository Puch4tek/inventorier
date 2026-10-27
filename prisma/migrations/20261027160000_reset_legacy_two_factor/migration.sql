-- One-time reset of legacy TOTP state created while 2FA was blocked.
-- Apply once before deploying code that enables twoFactor; passkeys are untouched.
-- A re-run before users re-enroll is a no-op, but never run it manually after
-- new TOTP enrollment because the flag alone cannot distinguish legacy state.
BEGIN;

-- OTP challenges and failed-attempt counters refer to the parent 2FA challenge.
DELETE FROM "verification" AS attempts
USING "verification" AS challenge
WHERE attempts."identifier" = '2fa-attempts-' || challenge."identifier"
  AND challenge."identifier" LIKE '2fa-%'
  AND challenge."value" IN (
    SELECT "id" FROM "user" WHERE "twoFactorEnabled" IS TRUE
  );

DELETE FROM "verification" AS otp
USING "verification" AS challenge
WHERE otp."identifier" = '2fa-otp-' || challenge."identifier"
  AND challenge."identifier" LIKE '2fa-%'
  AND challenge."value" IN (
    SELECT "id" FROM "user" WHERE "twoFactorEnabled" IS TRUE
  );

DELETE FROM "verification"
WHERE (
    ("identifier" LIKE '2fa-%'
      AND "identifier" NOT LIKE '2fa-attempts-%'
      AND "identifier" NOT LIKE '2fa-otp-%')
    OR "identifier" LIKE 'trust-device-%'
  )
  AND "value" IN (
    SELECT "id" FROM "user" WHERE "twoFactorEnabled" IS TRUE
  );

DELETE FROM "twoFactor"
WHERE "userId" IN (
  SELECT "id" FROM "user" WHERE "twoFactorEnabled" IS TRUE
);
DELETE FROM "session"
WHERE "userId" IN (
  SELECT "id" FROM "user" WHERE "twoFactorEnabled" IS TRUE
);
UPDATE "user"
SET "twoFactorEnabled" = false
WHERE "twoFactorEnabled" IS TRUE;

COMMIT;
