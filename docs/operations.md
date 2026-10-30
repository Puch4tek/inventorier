# Operations

## Instance and database lifecycle

Each application instance is a separate organizational space and must use its own database. A fresh installation must use a **new, empty database** and the bootstrap procedure in [Development: Local startup](development.md#local-startup). Bootstrap does not migrate or import an existing installation's data. Do not point it at a populated or production database; never use `migrate reset` or `db push --force-reset` on an existing database.

For regular releases, stop the old application version while applying migrations, take a recoverable database backup, then use the normal `prisma migrate deploy` procedure in [Development: Migrations](development.md#migrations-and-generated-client) before starting the new version. Review each migration and verify backups can be restored before high-impact changes.

Keep a database backup and its restore instructions, and periodically test a restore. Preserve `SMTP_ENCRYPTION_KEY` in a separate secure secret store: the SMTP password is encrypted in the database, and a database backup alone cannot recover it without the matching key.

### One-time legacy MFA migration

Before deploying the version that enables the current two-factor authentication flow to an existing installation, apply migration `20261027160000_reset_legacy_two_factor` through the normal migration deployment. It clears old TOTP factors, related challenges and trusted-device records, and sessions for users whose legacy `twoFactorEnabled` flag is true. It preserves passkeys. Inform affected users that they must enroll in TOTP again.

This is a one-time transition, not a maintenance reset. Do not manually rerun the migration after users have enrolled: it cannot distinguish new TOTP state from legacy state and would remove factors and sessions for enrolled users. Stop the old application, back up the database, and apply migrations before starting the new code.

### Recovering a database from the earlier bootstrap snapshot

Use this procedure **only** for a database created by the previous bootstrap that recorded exactly one migration, `20261028115504_initial_snapshot`. Stop the application, take and verify a backup, and confirm the live schema matches `prisma/bootstrap-migrations/20261028115504_initial_snapshot/migration.sql`. `prisma migrate resolve` changes migration history; it does not execute or validate schema changes.

If a previous deployment attempt left `20261027115504_apply_the_schema` failed, inspect migration status and the database schema first. Only after confirming that this exact old snapshot is present, mark that failed attempt as rolled back:

```bash
npx prisma migrate status --config prisma7.config.ts
npx prisma migrate resolve --config prisma7.config.ts --rolled-back 20261027115504_apply_the_schema
```

Then, for this verified snapshot only, baseline the three migrations already represented by it and deploy the remaining migration:

```bash
npx prisma migrate resolve --config prisma7.config.ts --applied 20261027115504_apply_the_schema
npx prisma migrate resolve --config prisma7.config.ts --applied 20261027160000_reset_legacy_two_factor
npx prisma migrate resolve --config prisma7.config.ts --applied 20261028180000_email_settings
npx prisma migrate deploy --config prisma7.config.ts
```

The final migration removes the obsolete `user.passwordHash` column. Do not run these `resolve` commands for a different migration history or an unverified schema. In particular, never mark the MFA migration applied merely to silence an error unless you have verified that the snapshot is exactly the one described above.

## Email and password reset

Configure SMTP under **Administration → Email** and send a test message before enabling password reset. The SMTP password is encrypted in the database with AES-256-GCM. Set `SMTP_ENCRYPTION_KEY` to a random 32-byte base64 value (for example, `openssl rand -base64 32`) before saving credentials. Keep the same key on every process for the instance, store it separately from the database backup, and never commit it. An empty password field preserves the saved password; entering a new one replaces it. If the key is lost, or changed without re-encrypting the saved value, enter and save the SMTP password again with the new key.

Password reset requires complete, working SMTP configuration. Its link lifetime defaults to 60 minutes and can be set from 15 minutes to 24 hours. On first SMTP setup, reset is initially selected but is activated only after a complete configuration is saved. Reading or updating an existing configuration does not silently change its saved reset setting. Disabling reset stops new requests, but links already issued remain valid until they expire. A successful reset revokes the user's sessions but preserves TOTP and passkeys; inactive accounts cannot request or use a reset.

Limits are five SMTP test messages per administrator per hour; five reset requests per email address per hour; 20 reset requests per client IP per hour; and 100 token-use attempts per IP per 15 minutes. Public reset responses are neutral so they do not disclose whether an account exists. Sending is attempted after the response using the platform's request-lifetime mechanism, not a durable queue; process termination or a platform time limit can prevent delivery, so the user may need to submit the request again.

In production, use HTTPS and set `BETTER_AUTH_URL` to the trusted public origin. To enable reset safely, a trusted reverse proxy must overwrite `x-real-ip` with the actual client IP, and `TRUSTED_PROXY_IP_HEADER` must be exactly `x-real-ip`. Without this configuration, production reset requests and token use are rejected. Never trust a client-supplied forwarding header unless the proxy replaces it.

Changing an account email requires opening the verification link sent to the new address; the link expires after one hour. Reauthentication with a password or passkey is not required, and the old address is not notified.

## MFA and passkeys

Users can enable TOTP with an authenticator app, save one-time backup codes, and manage passkeys in account settings. Password sign-in for a TOTP-enabled account requires a TOTP or backup code. A passkey is a separate passwordless sign-in method and remains usable when TOTP is enabled. Trusting a device is optional and lasts up to 30 days, renewed on the next sign-in.

Production WebAuthn requires HTTPS and a stable domain. Set `PASSKEY_RP_ID` to the domain only (no scheme or port), `PASSKEY_ORIGIN` to the exact application origin, and `BETTER_AUTH_URL` to that same origin. The RP ID must be the origin host or a parent domain. Changing the RP ID prevents existing passkeys from working; coordinate any domain change and user re-enrollment in advance. Local development defaults to `localhost` and `http://localhost:3000`.

An administrator can reset a user's MFA factors and passkeys; this invalidates that user's sessions. The one-time legacy MFA migration above is different: it preserves passkeys but clears legacy TOTP state for enrolled accounts.

## Accounts and warehouse permissions

Self-registration is enabled by default and can be disabled by an administrator. The first account on a fresh instance becomes an administrator; later public registrations are ordinary users. Disabling registration does not prevent administrators from creating accounts. New accounts do not automatically get access to a warehouse.

Access is assigned independently for each warehouse:

- `USER` can view warehouse data and change item quantities.
- `MANAGER` can also manage warehouse data and user access in that warehouse. A manager cannot change or remove their own assignment.
- Global `ADMIN` has instance-wide access and does not need warehouse memberships.

Only an administrator can create or delete warehouses, and the last warehouse cannot be deleted. Administrators assign the first manager; a warehouse may have none. Assign a user or manager role separately for every warehouse the account should access. See [warehouse access implementation](../src/server/warehouses/permissions.ts) and [warehouse management](../src/server/warehouses/manage-warehouses.ts).

## Operational references

- [Prisma migrations](../prisma/migrations/), [bootstrap snapshot](../prisma/bootstrap-migrations/20261028115504_initial_snapshot/migration.sql)
- [SMTP encryption and settings](../src/server/settings/email.ts), [reset flow and proxy checks](../src/server/auth/password-reset.ts)
- [Passkey configuration](../src/lib/passkey-config.ts), [authentication configuration](../src/lib/auth.ts)
- [Migration recovery and schema tests](../tests/warehouse-schema.test.mjs)
