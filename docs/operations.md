# Operations

## Instance and database lifecycle

Each application instance is a separate organizational space and must use its own database. A fresh installation must use a **new, empty database** and the bootstrap procedure in [Development: Local startup](development.md#local-startup). Bootstrap does not migrate or import an existing installation's data. Do not point it at a populated or production database; never use `migrate reset` or `db push --force-reset` on an existing database.

For regular releases, stop the old application version while applying migrations, take a recoverable database backup, then use the normal `prisma migrate deploy` procedure in [Development: Migrations](development.md#migrations-and-generated-client) before starting the new version. Review each migration and verify backups can be restored before high-impact changes.

Older development databases may have migration histories that are no longer supported. Create a new, empty development database and initialize it using the bootstrap procedure rather than attempting to baseline the old history. Do not reset or delete an existing database or volume without verifying its contents and intended use.

Keep a database backup and its restore instructions, and periodically test a restore. Preserve `APP_ENCRYPTION_KEY` in a separate secure secret store: SMTP passwords and OIDC client secrets are encrypted in the database, and a database backup alone cannot recover them without the matching key. See [key management](#keys).

## Email and password reset

Configure SMTP under **Administration → Email** and send a test message before enabling password reset. The SMTP password is encrypted in the database with AES-256-GCM. Set `APP_ENCRYPTION_KEY` to a canonical Base64 encoding of a random 32-byte key (for example, generate one with `openssl rand -base64 32`) before saving credentials. Keep the same key on every process for the instance, store it separately from the database backup, and never commit it. An empty password field preserves the saved password; entering a new one replaces it. If the key is lost, or changed without re-encrypting the saved value, enter and save the SMTP password again with the new key.

Password reset requires complete, working SMTP configuration. Its link lifetime defaults to 60 minutes and can be set from 15 minutes to 24 hours. On first SMTP setup, reset is initially selected but is activated only after a complete configuration is saved. Reading or updating an existing configuration does not silently change its saved reset setting. Disabling reset stops new requests, but links already issued remain valid until they expire. A successful reset revokes the user's sessions but preserves TOTP and passkeys; inactive accounts cannot request or use a reset.

Limits are five SMTP test messages per administrator per hour; five reset requests per email address per hour; 20 reset requests per client IP per hour; and 100 token-use attempts per IP per 15 minutes. Public reset responses are neutral so they do not disclose whether an account exists. Sending is attempted after the response using the platform's request-lifetime mechanism, not a durable queue; process termination or a platform time limit can prevent delivery, so the user may need to submit the request again.

In production, use HTTPS and set `BETTER_AUTH_URL` to the trusted public origin. To enable reset safely, a trusted reverse proxy must overwrite `x-real-ip` with the actual client IP, and `TRUSTED_PROXY_IP_HEADER` must be exactly `x-real-ip`. Without this configuration, production reset requests and token use are rejected. Never trust a client-supplied forwarding header unless the proxy replaces it.

Changing an account email requires opening the verification link sent to the new address; the link expires after one hour. Reauthentication with a password or passkey is not required, and the old address is not notified.

## Keys

`APP_ENCRYPTION_KEY` protects application-managed ciphertexts in `AppSettings`: SMTP passwords and OIDC client secrets. It must be canonical Base64 for exactly 32 random bytes (44 characters, ending in `=`), be stable across all instances, and be backed up in a separate secret manager. A database backup without this key cannot restore these credentials. `BETTER_AUTH_SECRET` is a different Better Auth secret and also protects Better Auth-managed OAuth tokens; it is not interchangeable with the app encryption key. See [OIDC secret handling](oidc.md#ustawienia-i-ochrona-sekretów).

Do not change `APP_ENCRYPTION_KEY` by simply replacing its environment value: existing SMTP passwords and OIDC client secrets would no longer decrypt. The repository has no general APP-key rotation tool. Before rotating it, plan a maintenance operation that can recover and re-save every encrypted secret under the new key. Loss of the key makes existing ciphertexts unrecoverable; restore the key from the secret backup, or enter and save replacement SMTP and OIDC credentials.

## MFA and passkeys

Users can enable TOTP with an authenticator app, save one-time backup codes, and manage passkeys in account settings. Password sign-in for a TOTP-enabled account requires a TOTP or backup code. A passkey is a separate passwordless sign-in method and remains usable when TOTP is enabled. Trusting a device is optional and lasts up to 30 days, renewed on the next sign-in.

Production WebAuthn requires HTTPS and a stable domain. Set `PASSKEY_RP_ID` to the domain only (no scheme or port), `PASSKEY_ORIGIN` to the exact application origin, and `BETTER_AUTH_URL` to that same origin. The RP ID must be the origin host or a parent domain. Changing the RP ID prevents existing passkeys from working; coordinate any domain change and user re-enrollment in advance. Local development defaults to `localhost` and `http://localhost:3000`.

An administrator can reset a user's MFA factors and passkeys; this invalidates that user's sessions.

## Accounts and warehouse permissions

Self-registration is enabled by default and can be disabled by an administrator. The first account on a fresh instance becomes an administrator; later public registrations are ordinary users. Disabling registration does not prevent administrators from creating accounts. New accounts do not automatically get access to a warehouse.

Access is assigned independently for each warehouse:

- `USER` can view warehouse data and change item quantities.
- `MANAGER` can also manage warehouse data and user access in that warehouse. A manager cannot change or remove their own assignment.
- Global `ADMIN` has instance-wide access and does not need warehouse memberships.

Only an administrator can create or delete warehouses, and the last warehouse cannot be deleted. Administrators assign the first manager; a warehouse may have none. Assign a user or manager role separately for every warehouse the account should access. See [warehouse access implementation](../src/server/warehouses/permissions.ts) and [warehouse management](../src/server/warehouses/manage-warehouses.ts).

## Operational references

- [Prisma migrations](../prisma/migrations/)
- [SMTP encryption and settings](../src/server/settings/email.ts), [reset flow and proxy checks](../src/server/auth/password-reset.ts)
- [OIDC setup and account behavior](oidc.md)
- [Passkey configuration](../src/lib/passkey-config.ts), [authentication configuration](../src/lib/auth.ts)
- [Schema tests](../tests/warehouse-schema.test.mjs)
