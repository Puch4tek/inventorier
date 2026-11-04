# Inventorier

Inventorier is a web application for managing inventory across multiple warehouses. It provides warehouse-specific access, item tracking and account administration in a Polish- and English-language interface.

## Features

- Manage warehouses, hierarchical locations, categories and items.
- Track quantities, item movements and other changes in item history; archive and restore items.
- Generate item barcodes and scan them with a camera.
- Assign warehouse members and managers; administrators manage the instance and its users.
- Sign in with a password, passkey or an explicitly configured OpenID Connect provider. Accounts can also use two-factor authentication.
- Configure registration, SMTP email and password reset from the administration interface.
- Install the application from a supported browser using its web app manifest.

## Technology

Next.js App Router, React, TypeScript, PostgreSQL, Prisma and Better Auth.

## Run with Docker Compose

You need Docker with Compose, a domain and an HTTPS reverse proxy. Compose starts the application and PostgreSQL 18, and stores database data in the `postgres_data` volume.

1. Clone the repository and prepare the environment:

   ```sh
   cp .env.example .env
   openssl rand -base64 32
   ```

2. Edit `.env`: set `DATABASE_USER` and `DATABASE_PASSWORD` to unique credentials, put the generated value in `APP_ENCRYPTION_KEY`, and set `BETTER_AUTH_URL` to the public HTTPS origin, for example `https://inventory.example.com`. Configure the reverse proxy to forward requests to port `3000`.

3. Start the services:

   ```sh
   docker compose pull
   docker compose up -d
   ```

   By default, Compose uses `ghcr.io/puch4tek/inventorier:dev`. Override it with `APP_IMAGE` if needed. The container applies Prisma migrations before starting the application.

4. Open the configured URL and register the first account. **The first registered user becomes the administrator.** Restrict access until that account is created. The administrator must create the first warehouse and can then manage users, warehouse access and registration.

Compose publishes both the app and PostgreSQL ports on the host. Restrict network access to them, and do not expose PostgreSQL publicly. Back up the database before updating the image: startup applies pending migrations automatically.

## Configuration

The application reads its configuration from environment variables. `.env.example` contains the starting values.

| Variable | Purpose |
| --- | --- |
| `DATABASE_HOST` | PostgreSQL host; Compose sets it to `postgres` for the application. |
| `DATABASE_PORT` | PostgreSQL port; default `5432`. |
| `DATABASE_NAME` | Database name; default `inventorier`. |
| `DATABASE_USER`, `DATABASE_PASSWORD` | Database credentials. Replace the example credentials outside local development. |
| `BETTER_AUTH_URL` | Public application origin. Use HTTPS for a deployed instance. |
| `APP_ENCRYPTION_KEY` | Required Base64-encoded key generated from 32 random bytes, used for authentication and encryption. Keep it private and stable, and preserve it separately from database backups. |
| `PASSKEY_ORIGIN` | Optional passkey origin. In production it defaults to `BETTER_AUTH_URL` and must match its origin. |
| `PASSKEY_RP_ID` | Optional passkey relying-party ID. In production it defaults to the origin host; an override must be the host or a parent domain. Keep it stable for enrolled passkeys. |
| `TRUSTED_PROXY_IP_HEADER` | Set to `x-real-ip` only if a trusted reverse proxy overwrites that header with the client IP. Required for production password-reset requests. |
| `APP_IMAGE` | Optional Docker Compose image override; not an application setting. |

SMTP, password reset and OIDC are configured in the administration interface. See the [OIDC guide](docs/oidc.md) and [operations guide](docs/operations.md) for details.

## Local development

Use Node.js 24, npm and PostgreSQL 18. Docker Compose can provide the database:

```sh
npm ci
cp .env.example .env
```

Set `BETTER_AUTH_URL=http://localhost:3000` and a freshly generated `APP_ENCRYPTION_KEY` in `.env`. Adjust the database settings if necessary, then start PostgreSQL and initialize a new, empty database:

```sh
docker compose up -d postgres
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). As with the Compose installation, the first registered user is the administrator and must create the first warehouse.

## Checks

```sh
npm run lint
npm run build
npm test
```

The test suite requires a running Docker daemon and a locally available `postgres:18` image (`docker pull postgres:18`). It runs smoke and OIDC integration tests against a disposable PostgreSQL container.

## Documentation

- [Development setup and commands](docs/development.md)
- [Architecture](docs/architecture.md)
- [Module reference](docs/module-reference.md)
- [Localization](docs/localization.md)
- [OpenID Connect](docs/oidc.md)
- [Operations](docs/operations.md)
