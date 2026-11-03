# Inventory App

Inventory management for organizations with warehouse-scoped access, item history, barcode scanning, and account security features.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- PostgreSQL with Prisma 7
- Better Auth with TOTP and WebAuthn passkeys

## Quick start

Prerequisites: Node.js, npm, and Docker with Compose.

1. Install dependencies and start the local PostgreSQL service:

   ```sh
   npm ci
   docker compose up -d
   ```

2. Copy `.env.example` to `.env` and set the database connection fields, an auth secret, and the local app URL. See [development setup](docs/development.md) for all settings.
3. Initialize a **new, empty local database** and generate the Prisma client:

   ```sh
   npx prisma migrate deploy --config prisma-bootstrap.config.ts
   npx prisma generate --config prisma-bootstrap.config.ts
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

   Open <http://localhost:3000>. On a fresh database, the first registered user becomes the administrator and must create the first warehouse.

> **Important:** Bootstrap is only for a new, empty database. Never point it at an existing installation. Follow the [database and deployment guide](docs/operations.md) before applying migrations to existing data.

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
npm test          # Run all tests (requires Docker and postgres:18)
npm run lint      # Run ESLint
npm run build     # Build for production
```

See [development setup](docs/development.md) for test execution and database commands.
