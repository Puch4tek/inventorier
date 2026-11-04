# Development

## Prerequisites

- Node.js 22.6 or newer. Next.js itself supports Node.js 20.9+, but the PostgreSQL test script uses Node's `--experimental-strip-types` option.
- npm (use the committed `package-lock.json` with `npm ci`).
- PostgreSQL 18 for local development. Docker and Docker Compose are optional for the application, but Docker is required to run the integration test suite.

## Environment

Create a root-level `.env` from [`.env.example`](../.env.example). Keep it out of version control; the values below are server-side settings, not `NEXT_PUBLIC_*` variables.

| Variable | Development | Production / purpose |
| --- | --- | --- |
| `DATABASE_HOST` | `127.0.0.1` | PostgreSQL host. Compose overrides this with `postgres` for the app container. |
| `DATABASE_NAME` | `inventorier` | PostgreSQL database name. |
| `DATABASE_PORT` | `5432` | PostgreSQL port. Compose uses it for the database listener and published port. |
| `DATABASE_USER` | `inventory` | PostgreSQL username. |
| `DATABASE_PASSWORD` | `inventory_dev_password` | PostgreSQL password. The example credentials are for local development only. |
| `BETTER_AUTH_URL` | `http://localhost:3000`. | Public application origin. Use HTTPS and the same origin as `PASSKEY_ORIGIN`. |
| `PASSKEY_ORIGIN` | Defaults to `http://localhost:3000` if unset. | Optional override; defaults to `BETTER_AUTH_URL`. Must be the same HTTPS origin, including any non-default port. |
| `PASSKEY_RP_ID` | Defaults to `localhost` if unset. | Optional override; defaults to the origin host. An explicit domain must equal the host or be its parent. Keep the existing RP ID stable for enrolled passkeys. |
| `APP_ENCRYPTION_KEY` | Required for authentication and encryption. Generate with `openssl rand -base64 32`. | Canonical Base64 encoding of exactly 32 random bytes. Keep identical across application processes and preserve separately from database backups. See [Operations](operations.md#keys). |
| `TRUSTED_PROXY_IP_HEADER` | Not needed locally. | Set to exactly `x-real-ip` only when a trusted reverse proxy overwrites that header with the client's IP. Required for production password-reset requests. |
| `NODE_ENV` | Set by the Next.js commands; do not normally set manually. | Next.js sets production mode for production builds and starts; this activates production URL, passkey, and proxy checks. |
| `TEST_DATABASE_URL` | Do not configure for the normal development server. | The test script creates and exports this value for its disposable test database. |

The application reads configuration in server code; there are no `NEXT_PUBLIC_*` environment variables in the current source. Next.js loads `.env` files from the repository root, not `src/`. `NEXT_PHASE` is managed by Next.js during builds and is only checked internally; do not set it as an application setting.

## Container image

Compose pulls `ghcr.io/puch4tek/inventorier:dev` by default. This public image follows the latest successful CI build on the `dev` branch, not a stable release, and runs in production mode. The Dockerfile builds a Next.js standalone server in a separate build stage and installs only production dependencies in the final image. It retains Prisma CLI and migration files so the container applies pending migrations before starting the server; a migration failure prevents startup. Compose waits for PostgreSQL to become healthy before starting the app.

To try local source changes in a container, build a separate image and select it for Compose:

```bash
docker build -t inventorier-local:dev .
APP_IMAGE=inventorier-local:dev docker compose up -d
```

Set `APP_IMAGE` on subsequent Compose commands that manage this local image as well. Without it, Compose uses the public image. This is a production-mode build, not a hot-reloading development server; use `npm run dev` for local development.

Prisma loads the datasource config during client generation, so the build command supplies temporary placeholder credentials. The build also generates a temporary encryption key; configure the stable runtime key in `.env`. The temporary values are not passed to the runtime image.

The app container connects to the Compose database using `postgres` as `DATABASE_HOST`, not `localhost`. For isolated HTTP testing with localhost or an IP address, set `BETTER_AUTH_URL` to the exact browser origin and align any passkey overrides. Browsers may not support passkeys on HTTP/IP, and production password reset still requires HTTPS and a trusted proxy. HTTP exposes passwords and session cookies to the network; use HTTPS through a trusted reverse proxy outside isolated testing. Compose publishes the application and PostgreSQL ports on the host, so restrict access appropriately. Back up existing databases before updating the image; automatic migrations can change existing data.

## Local startup

1. Install dependencies and prepare the environment:

   ```bash
   npm ci
   cp .env.example .env
   ```

   Fill the local values from the table. Generate a new `APP_ENCRYPTION_KEY`; do not commit `.env`.

2. Start the optional local PostgreSQL service:

   ```bash
   docker compose up -d postgres
   ```

   The Compose service is PostgreSQL 18 and uses a persistent development volume. Its credentials are for local development only; do not reuse them in production.

3. Create a **new, empty** database for this instance, then set `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PORT`, `DATABASE_USER`, and `DATABASE_PASSWORD` for it. Apply the first-install migration and generate the Prisma client:

   ```bash
   npx prisma migrate deploy --config prisma7.config.ts
   npx prisma generate --config prisma7.config.ts
   ```

   The migrations create the schema; they do not import data or seed a warehouse. Use a new, empty database for a new installation. For existing installations follow the backup and update procedure below. Never use `migrate reset` or `db push --force-reset` on an existing database.

4. Start the application:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`. The first account created in a fresh installation becomes an administrator without an additional token. Keep the instance private until this account is created. Create the first warehouse manually; user accounts do not receive warehouse access automatically. The administrator can then disable self-registration.

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

Run the smoke tests used by CI with:

```bash
npm test
```

The smoke suite checks a fresh migration, first-account administrator creation and sign-in, warehouse/item use, and rejection of a user without warehouse access. It intentionally does not retain broad unit/integration suites or test migration-history continuity.

The test script requires a running Docker daemon and a locally available `postgres:18` image; it checks for the image but does not pull it. If needed, fetch it first with `docker pull postgres:18`. It creates a uniquely named database in a disposable container, publishes PostgreSQL only on loopback, stores data in a 1 GiB `tmpfs` (no bind mount or Docker volume), applies migrations to the empty database, runs the smoke test and OIDC integration tests with a simulated provider using Node's built-in test runner, and removes the container on exit. It never uses the development Compose database volume. Do not edit the script to use a persistent database or volume.

GitHub Actions runs client generation, lint, build and the same test suite on pushes and pull requests.

## Related source

- [Environment example](../.env.example), [Compose service](../compose.yaml)
- [Prisma schema](../prisma/schema.prisma), [migration config](../prisma7.config.ts)
- [Test runner](../tests/run-postgres-tests.sh)
