# Inventory App

Inventory management for organizations with warehouse-scoped access, item history, barcode scanning, and account security features.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- PostgreSQL with Prisma 7
- Better Auth with TOTP and WebAuthn passkeys

## Quick start

Prerequisites: Docker with Compose, a domain, and an HTTPS reverse proxy.

1. Prepare the configuration:

   ```sh
   cp .env.example .env
   ```

2. Set `DATABASE_USER`, `DATABASE_PASSWORD`, `APP_ENCRYPTION_KEY`, and `BETTER_AUTH_URL` in `.env`. Use unique database credentials and a random encryption key; set the URL to the public HTTPS origin. See [development setup](docs/development.md#environment) for all settings. Configure the reverse proxy to forward requests to the app on port 3000.

3. Start the application and its new database:

   ```sh
   docker compose up -d --build
   ```

   The application applies migrations before starting. Use a new, empty database for a new instance.
4. Open the public HTTPS URL and register the first account. **The first registered user becomes the administrator** and must create the first warehouse. Until this account exists, restrict access to the installer so nobody else can claim it. Afterward, the administrator can disable self-registration.

> **Updating an existing installation:** Stop the old application and make a recoverable database backup before starting the new version, which automatically applies pending migrations. See the [database and deployment guide](docs/operations.md).

For local development with Node.js and a local PostgreSQL container, follow [development setup](docs/development.md#local-startup).

## Developer documentation

- [Development setup and commands](docs/development.md) — prerequisites, environment, database, tests, and troubleshooting.
- [Architecture overview](docs/architecture.md) — application layers, domain concepts, and key data flows.
- [Module reference](docs/module-reference.md) — responsibilities and entry points across maintained source modules.
- [Localization guide](docs/localization.md) — translating messages and adding supported languages.
- [OIDC login](docs/oidc.md) — OpenID Connect behavior, Authentik setup, and secret handling.
- [Operations and security-sensitive procedures](docs/operations.md) — migrations, auth/MFA/passkeys, email/password reset, and warehouse permissions.

## Common commands

```sh
npm run dev       # Start the development server
npm test          # Run smoke tests (requires Docker and postgres:18)
npm run lint      # Run ESLint
npm run build     # Build for production
```

See [development setup](docs/development.md) for test execution and database commands.
