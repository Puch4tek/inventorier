ALTER TABLE "AppSettings"
  ADD COLUMN "oidcRevision" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
