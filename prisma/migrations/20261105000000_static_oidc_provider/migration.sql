UPDATE "account"
SET "providerId" = 'oidc'
WHERE "providerId" = (
  SELECT 'oidc-' || "oidcRevision" FROM "AppSettings" WHERE "id" = 1
);

ALTER TABLE "AppSettings" DROP COLUMN "oidcRevision";
