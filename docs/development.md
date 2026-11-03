# Development

## Prerequisites

- Node.js 22.6 or newer. Next.js itself supports Node.js 20.9+, but the PostgreSQL test script uses Node's `--experimental-strip-types` option.
- npm (use the committed `package-lock.json` with `npm ci`).
- PostgreSQL 18 for local development. Docker and Docker Compose are optional for the application, but Docker is required to run the integration test suite.

## Environment

Create a root-level `.env` from [`.env.example`](../.env.example). Keep it out of version control; the values below are server-side settings, not `NEXT_PUBLIC_*` variables.

| Variable | Development | Production / purpose |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for the local Compose service; use the local credentials from `compose.yaml`. | Required by Prisma and the application. Point each instance to its own database. |
| `BETTER_AUTH_SECRET` | Set a private random secret; for example, generate one with `openssl rand -base64 32`. | Required by Better Auth. Keep stable and private across all application processes for the instance. |
| `BETTER_AUTH_URL` | `http://localhost:3000`. | Public application origin. Use HTTPS and the same origin as `PASSKEY_ORIGIN`. |
| `PASSKEY_ORIGIN` | Defaults to `http://localhost:3000` if unset. | Required at runtime; exact HTTPS origin, including any non-default port. |
| `PASSKEY_RP_ID` | Defaults to `localhost` if unset. | Required at runtime; a domain name without scheme or port, equal to or a parent domain of the origin host. |
| `APP_ENCRYPTION_KEY` | Needed when saving SMTP credentials or an OIDC client secret. Generate with `openssl rand -base64 32`. | Canonical Base64 encoding of exactly 32 random bytes. Keep identical across application processes and preserve separately from database backups. See [Operations](operations.md#keys). |
| `TRUSTED_PROXY_IP_HEADER` | Not needed locally. | Set to exactly `x-real-ip` only when a trusted reverse proxy overwrites that header with the client's IP. Required for production password-reset requests. |
| `NODE_ENV` | Set by the Next.js commands; do not normally set manually. | Next.js sets production mode for production builds and starts; this activates production URL, passkey, and proxy checks. |
| `TEST_DATABASE_URL` | Do not configure for the normal development server. | The test script creates and exports this value for its disposable test database. |

The application reads configuration in server code; there are no `NEXT_PUBLIC_*` environment variables in the current source. Next.js loads `.env` files from the repository root, not `src/`. `NEXT_PHASE` is managed by Next.js during builds and is only checked internally; do not set it as an application setting.

## Container image

The Dockerfile builds a Next.js standalone server in a separate build stage and installs only production dependencies in the final image. It retains Prisma CLI and migration files so the container applies pending migrations before starting the server; a migration failure prevents startup. Compose waits for PostgreSQL to become healthy before starting the app.

The app container connects to the Compose database using `postgres` as the `DATABASE_URL` host, not `localhost`. Production mode requires a valid HTTPS origin and passkey domain, even when testing the image locally. The included database credentials are for development only. Back up existing databases before updating the image; automatic migrations can change existing data.

## Local startup

1. Install dependencies and prepare the environment:

   ```bash
   npm ci
   cp .env.example .env
   ```

   Fill the local values from the table. Generate a new `BETTER_AUTH_SECRET`; do not commit `.env`.

2. Start the optional local PostgreSQL service:

   ```bash
   docker compose up -d postgres
   ```

   The Compose service is PostgreSQL 18 and uses a persistent development volume. Its credentials are for local development only; do not reuse them in production.

3. Create a **new, empty** database for this instance, then set `DATABASE_URL` to it. Apply the first-install migration and generate the Prisma client:

   ```bash
   npx prisma migrate deploy --config prisma-bootstrap.config.ts
   npx prisma generate --config prisma-bootstrap.config.ts
   ```

   Bootstrap creates an empty schema; it does not import data or seed a warehouse. It must not be pointed at an existing installation. For subsequent deployments use the normal migration configuration below. Never use `migrate reset` or `db push --force-reset` on an existing database.

4. Start the application:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`. The first account created in a fresh installation becomes an administrator. Create the first warehouse manually; user accounts do not receive warehouse access automatically.

## Migrations and generated client

For normal schema updates and later deployments, apply committed migrations and regenerate the Prisma client:

```bash
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

Back up an existing database before migrations. Older development databases may have unsupported migration histories; see [Operations](operations.md#instance-and-database-lifecycle).

## Build and lint

```bash
npm run lint
npm run build
```

Next.js 16 does not run ESLint as part of `next build`, so run both commands explicitly.

## Tests

Run the complete test suite with:

```bash
npm test
```

The test script requires a running Docker daemon and a locally available `postgres:18` image; it checks for the image but does not pull it. If needed, fetch it first with `docker pull postgres:18`. It starts a uniquely named container, binds its temporary database port to loopback, stores PostgreSQL data in a 1 GiB `tmpfs` (no bind mount or Docker volume), runs integration and localization tests with Node's built-in test runner, and removes the container on exit. The runner includes OIDC and secret-encryption tests that use a synthetic local provider; this does not verify interoperability with a live Authentik server. Do not edit the script to use a persistent database or volume.

## Related source

- [Environment example](../.env.example), [Compose service](../compose.yaml)
- [Prisma schema](../prisma/schema.prisma), [bootstrap config](../prisma-bootstrap.config.ts), [normal migration config](../prisma7.config.ts)
- [Test runner](../tests/run-postgres-tests.sh)
