import { defineConfig } from "prisma/config";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for bootstrap migration tests.");
}

export default defineConfig({
  schema: fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url)),
  migrations: {
    path: fileURLToPath(new URL("../prisma/bootstrap-migrations", import.meta.url)),
  },
  datasource: {
    url: databaseUrl,
  },
});
