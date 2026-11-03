"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Image from "next/image";
import bwipjs from "bwip-js/browser";
import { Button } from "@/components/button";
import { useLocale, useTranslations } from "next-intl";
import type { SecuritySettingsData } from "@/server/security/get-security-settings";
import {
  authorizePasskeyManagement,
  beginTotpSetup,
  cancelPendingTotpSetup,
  confirmTotpSetup,
  disableTotp,
  regenerateBackupCodes,
  type SecurityErrorKey,
} from "./security-actions";
import { authClient } from "@/lib/auth-client";

type TotpSetupState = {
  totpURI: string;
  backupCodes: string[];
};

type PasskeySettingsItem = SecuritySettingsData["passkeys"][number];
type PasskeyMessageKey =
  | "passkeys.unsupported"
  | "passkeys.invalidName"
  | "passkeys.addFailed"
  | "passkeys.renameFailed"
  | "passkeys.deleteFailed"
  | "passkeys.added"
  | "passkeys.renamed"
  | "passkeys.deleted";
type TwoFactorNoticeKey =
  | "twoFactor.notices.scanAndSave"
  | "twoFactor.notices.enabled"
  | "twoFactor.notices.cancelled"
  | "twoFactor.notices.regenerated"
  | "twoFactor.notices.disabled";

function getAuthErrorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined;
}

function subscribeToBrowser() {
  return () => {};
}

function isWebauthnAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function"
  );
}

export function SecuritySettings({
  initialSettings,
  canManageWithPassword,
}: {
  initialSettings: SecuritySettingsData;
  canManageWithPassword: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("auth.security");
  const [settings, setSettings] = useState(initialSettings);
  const [setup, setSetup] = useState<TotpSetupState | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<SecurityErrorKey>();
  const [notice, setNotice] = useState<TwoFactorNoticeKey>();
  const [passkeyError, setPasskeyError] = useState<SecurityErrorKey | PasskeyMessageKey>();
  const [passkeyNotice, setPasskeyNotice] = useState<PasskeyMessageKey>();
  const webauthnAvailable = useSyncExternalStore(
    subscribeToBrowser,
    isWebauthnAvailable,
    () => null,
  );
  const [isPending, startTransition] = useTransition();

  const totpURI = setup?.totpURI;
  const qrSvg = useMemo(() => {
    if (!totpURI) return null;
    try {
      return bwipjs.toSVG({
        bcid: "qrcode",
        text: totpURI,
        scale: 4,
        padding: 3,
      });
    } catch {
      return null;
    }
  }, [totpURI]);

  function run(action: () => Promise<void>) {
    setError(undefined);
    setNotice(undefined);
    startTransition(action);
  }

  function handleBeginSetup(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    run(async () => {
      const result = await beginTotpSetup(currentPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSetup(result.data);
      setBackupCodes(null);
      setSettings((current) => ({ ...current, totpSetupPending: true }));
      setNotice("twoFactor.notices.scanAndSave");
    });
  }

  function handleConfirmSetup(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    const totpCode = String(formData.get("code") ?? "");
    run(async () => {
      const result = await confirmTotpSetup({
        password: currentPassword,
        code: totpCode,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSetup(null);
      setSettings((current) => ({
        ...current,
        twoFactorEnabled: true,
        totpSetupPending: false,
      }));
      setNotice("twoFactor.notices.enabled");
    });
  }

  function handleCancelSetup(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    run(async () => {
      const result = await cancelPendingTotpSetup(currentPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSetup(null);
      setSettings((current) => ({ ...current, totpSetupPending: false }));
      setNotice("twoFactor.notices.cancelled");
    });
  }

  function handleRegenerateCodes(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    run(async () => {
      const result = await regenerateBackupCodes(currentPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBackupCodes(result.data.backupCodes);
      setNotice("twoFactor.notices.regenerated");
    });
  }

  function handleDisableTotp(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    run(async () => {
      const result = await disableTotp(currentPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSetup(null);
      setBackupCodes(null);
      setSettings((current) => ({
        ...current,
        twoFactorEnabled: false,
        totpSetupPending: false,
      }));
      setNotice("twoFactor.notices.disabled");
    });
  }

  function handleAddPasskey(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    setPasskeyError(undefined);
    setPasskeyNotice(undefined);
    run(async () => {
      if (webauthnAvailable !== true) {
        setPasskeyError("passkeys.unsupported");
        return;
      }
      if (!name || name.length > 64) {
        setPasskeyError("passkeys.invalidName");
        return;
      }

      const authorization = await authorizePasskeyManagement(currentPassword);
      if (!authorization.success) {
        setPasskeyError(authorization.error);
        return;
      }

      let result: Awaited<ReturnType<typeof authClient.passkey.addPasskey>>;
      try {
        result = await authClient.passkey.addPasskey({
          name,
          createSession: false,
        });
      } catch {
        setPasskeyError("passkeys.addFailed");
        return;
      }
      if (result.error || !result.data) {
        const code = getAuthErrorCode(result.error);
        setPasskeyError(
          code === "INVALID_PASSKEY_NAME"
            ? "passkeys.invalidName"
            : code === "PASSKEY_REAUTH_REQUIRED"
              ? "passkeys.reauthenticateFailed"
              : "passkeys.addFailed",
        );
        return;
      }

      const passkey = result.data;
      setSettings((current) => ({
        ...current,
        passkeys: [
          toPasskeySettingsItem(passkey),
          ...current.passkeys.filter((item) => item.id !== passkey.id),
        ],
      }));
      setPasskeyNotice("passkeys.added");
    });
  }

  function handleRenamePasskey(passkeyId: string, formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    setPasskeyError(undefined);
    setPasskeyNotice(undefined);
    run(async () => {
      if (!name || name.length > 64) {
        setPasskeyError("passkeys.invalidName");
        return;
      }

      const authorization = await authorizePasskeyManagement(currentPassword);
      if (!authorization.success) {
        setPasskeyError(authorization.error);
        return;
      }

      let result: Awaited<
        ReturnType<typeof authClient.$fetch<{
          passkey: { id: string; name?: string | null };
        }>>
      >;
      try {
        result = await authClient.$fetch<{
          passkey: { id: string; name?: string | null };
        }>("/passkey/update-passkey", {
          method: "POST",
          body: { id: passkeyId, name },
          throw: false,
        });
      } catch {
        setPasskeyError("passkeys.renameFailed");
        return;
      }
      if (result.error || !result.data?.passkey) {
        const code = getAuthErrorCode(result.error);
        setPasskeyError(
          code === "INVALID_PASSKEY_NAME"
            ? "passkeys.invalidName"
            : code === "PASSKEY_REAUTH_REQUIRED"
              ? "passkeys.reauthenticateFailed"
              : "passkeys.renameFailed",
        );
        return;
      }

      setSettings((current) => ({
        ...current,
        passkeys: current.passkeys.map((item) =>
          item.id === passkeyId ? { ...item, name: result.data.passkey.name ?? name } : item,
        ),
      }));
      setPasskeyNotice("passkeys.renamed");
    });
  }

  function handleDeletePasskey(passkeyId: string, formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    setPasskeyError(undefined);
    setPasskeyNotice(undefined);
    run(async () => {
      const authorization = await authorizePasskeyManagement(currentPassword);
      if (!authorization.success) {
        setPasskeyError(authorization.error);
        return;
      }

      let result: Awaited<
        ReturnType<typeof authClient.$fetch<{ status: boolean }>>
      >;
      try {
        result = await authClient.$fetch<{ status: boolean }>(
          "/passkey/delete-passkey",
          {
            method: "POST",
            body: { id: passkeyId },
            throw: false,
          },
        );
      } catch {
        setPasskeyError("passkeys.deleteFailed");
        return;
      }
      if (result.error || result.data?.status !== true) {
        const code = getAuthErrorCode(result.error);
        setPasskeyError(
          code === "PASSKEY_REAUTH_REQUIRED"
            ? "passkeys.reauthenticateFailed"
            : "passkeys.deleteFailed",
        );
        return;
      }

      setSettings((current) => ({
        ...current,
        passkeys: current.passkeys.filter((item) => item.id !== passkeyId),
      }));
      setPasskeyNotice("passkeys.deleted");
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">
            {t("twoFactor.heading")}
          </h2>
          <p className="mt-2 text-sm text-app-muted">
            {t("twoFactor.description")}
          </p>
        </div>

        {!canManageWithPassword ? (
          <p className="mb-5 rounded-xl border border-app-border bg-app-surface-muted p-4 text-sm text-app-muted">
            {t("passwordRequiredForManagement")}
          </p>
        ) : null}

        <p className="mb-5 text-sm">
          {t("twoFactor.status")}{" "}
          <strong>
            {settings.twoFactorEnabled
              ? t("twoFactor.enabled")
              : settings.totpSetupPending
                ? t("twoFactor.pending")
                : t("twoFactor.disabled")}
          </strong>
        </p>

        {canManageWithPassword &&
        !settings.twoFactorEnabled &&
        !settings.totpSetupPending &&
        !setup ? (
          <form action={handleBeginSetup} className="space-y-4">
            <PasswordField
              id="mfa-enable-password"
              label={t("currentPassword")}
            />
            <Button
              variant="primary"
              type="submit"
              disabled={isPending}
              className="px-5 py-3 text-sm disabled:opacity-50"
            >
              {isPending ? t("twoFactor.preparing") : t("twoFactor.configure")}
            </Button>
          </form>
        ) : null}

        {canManageWithPassword && setup ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-app-border bg-app-surface-muted p-4">
              <p className="mb-3 text-sm font-semibold">
                {t("twoFactor.scanCode")}
              </p>
              {qrSvg ? (
                <Image
                  className="inline-block rounded-lg bg-white p-3"
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
                  alt={t("twoFactor.qrAlt")}
                  width={220}
                  height={220}
                  unoptimized
                />
              ) : (
                <p className="text-sm text-app-muted">
                  {t("twoFactor.qrUnavailable")}
                </p>
              )}
              <p className="mt-3 break-all font-mono text-xs text-app-muted">
                {setup.totpURI}
              </p>
            </div>
            <div className="rounded-xl border border-app-warning/30 bg-app-warning-surface p-4">
              <p className="font-semibold">{t("twoFactor.saveBackupCodes")}</p>
              <p className="mt-1 text-sm text-app-muted">
                {t("twoFactor.backupCodesDescription")}
              </p>
              <BackupCodeList codes={setup.backupCodes} />
            </div>
            <form action={handleConfirmSetup} className="space-y-4">
              <label className="block">
                <span className="field-label">{t("twoFactor.code")}</span>
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,8}"
                  required
                  maxLength={8}
                  className="field-input"
                />
              </label>
              <PasswordField id="mfa-confirm-password" label={t("currentPassword")} />
              <Button
                variant="primary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                {isPending ? t("twoFactor.verifying") : t("twoFactor.confirmEnable")}
              </Button>
            </form>
          </div>
        ) : null}

        {canManageWithPassword && settings.totpSetupPending && !setup ? (
          <div className="space-y-4">
            <p className="text-sm text-app-muted">
              {t("twoFactor.pendingDescription")}
            </p>
            <form action={handleConfirmSetup} className="space-y-4">
              <label className="block">
                <span className="field-label">{t("twoFactor.code")}</span>
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,8}"
                  required
                  maxLength={8}
                  className="field-input"
                />
              </label>
              <PasswordField id="mfa-resume-password" label={t("currentPassword")} />
              <Button
                variant="primary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                {t("twoFactor.confirmSetup")}
              </Button>
            </form>
            <form action={handleCancelSetup} className="space-y-4">
              <PasswordField
                id="mfa-cancel-password"
                label={t("twoFactor.cancelPassword")}
              />
              <Button
                variant="secondary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                {t("twoFactor.cancelSetup")}
              </Button>
            </form>
          </div>
        ) : null}

        {canManageWithPassword && settings.twoFactorEnabled ? (
          <div className="space-y-5">
            <form action={handleRegenerateCodes} className="space-y-4">
              <p className="text-sm text-app-muted">
                {t("twoFactor.regenerateDescription")}
              </p>
              <PasswordField id="mfa-backup-password" label={t("currentPassword")} />
              <Button
                variant="secondary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                {t("twoFactor.regenerate")}
              </Button>
            </form>
            <form action={handleDisableTotp} className="space-y-4 border-t border-app-border pt-5">
              <p className="text-sm text-app-muted">
                {t("twoFactor.disableDescription")}
              </p>
              <PasswordField id="mfa-disable-password" label={t("currentPassword")} />
              <Button
                variant="danger"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                {t("twoFactor.disable")}
              </Button>
            </form>
          </div>
        ) : null}

        {canManageWithPassword && backupCodes ? (
          <div className="mt-5 rounded-xl border border-app-warning/30 bg-app-warning-surface p-4">
            <p className="font-semibold">{t("twoFactor.newBackupCodes")}</p>
            <p className="mt-1 text-sm text-app-muted">
              {t("twoFactor.saveCodesSafely")}
            </p>
            <BackupCodeList codes={backupCodes} />
          </div>
        ) : null}
        {error ? <p role="alert" className="status-error mt-4">{t(error)}</p> : null}
        {notice ? <p role="status" className="status-success mt-4">{t(notice)}</p> : null}
      </section>

      <section className="panel-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">{t("passkeys.heading")}</h2>
          <p className="mt-2 text-sm text-app-muted">
            {t("passkeys.description")}
          </p>
        </div>
        {settings.passkeys.length > 0 ? (
          <ul className="divide-y divide-app-border">
            {settings.passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="space-y-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">
                    {passkey.name || t("passkeys.unnamed")}
                  </p>
                  <p className="mt-1 text-sm text-app-muted">
                    {passkey.deviceType === "multiDevice"
                      ? t("passkeys.synchronized")
                      : t("passkeys.deviceBound")}
                    {passkey.backedUp ? ` · ${t("passkeys.backupAvailable")}` : ""}
                    {passkey.createdAt
                      ? ` · ${t("passkeys.addedAt", { date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(passkey.createdAt)) })}`
                      : ""}
                  </p>
                </div>
                {canManageWithPassword ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form
                      action={(formData) =>
                        handleRenamePasskey(passkey.id, formData)
                      }
                      className="space-y-3"
                    >
                      <label className="block">
                        <span className="field-label">{t("passkeys.rename")}</span>
                        <input
                          name="name"
                          defaultValue={passkey.name ?? ""}
                          maxLength={64}
                          required
                          className="field-input"
                        />
                      </label>
                      <PasswordField
                        id={`passkey-rename-password-${passkey.id}`}
                        label={t("currentPassword")}
                      />
                      <Button
                        variant="secondary"
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2.5 text-sm disabled:opacity-50"
                      >
                        {t("passkeys.rename")}
                      </Button>
                    </form>
                    <form
                      action={(formData) =>
                        handleDeletePasskey(passkey.id, formData)
                      }
                      className="space-y-3"
                    >
                      <div className="field-label">{t("passkeys.delete")}</div>
                      <p className="text-sm text-app-muted">
                        {t("passkeys.deleteDescription")}
                      </p>
                      <PasswordField
                        id={`passkey-delete-password-${passkey.id}`}
                        label={t("currentPassword")}
                      />
                      <Button
                        variant="danger"
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2.5 text-sm disabled:opacity-50"
                      >
                        {t("passkeys.delete")}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-app-muted">{t("passkeys.empty")}</p>
        )}
        {webauthnAvailable === false ? (
          <p className="status-error mt-5">
            {t("passkeys.unsupported")}
          </p>
        ) : null}
        {canManageWithPassword && webauthnAvailable !== false ? (
          <form action={handleAddPasskey} className="mt-6 space-y-4 border-t border-app-border pt-5">
            <h3 className="font-semibold">{t("passkeys.add")}</h3>
            <label className="block">
              <span className="field-label">{t("passkeys.name")}</span>
              <input
                name="name"
                maxLength={64}
                required
                autoComplete="off"
                className="field-input"
                placeholder={t("passkeys.namePlaceholder")}
              />
            </label>
            <PasswordField
              id="passkey-add-password"
              label={t("currentPassword")}
            />
            <Button
              variant="primary"
              type="submit"
              disabled={isPending || webauthnAvailable !== true}
              className="px-5 py-3 text-sm disabled:opacity-50"
            >
              {isPending ? t("passkeys.waiting") : t("passkeys.adding")}
            </Button>
          </form>
        ) : null}
        {passkeyError ? (
          <p role="alert" className="status-error mt-4">
            {t(passkeyError)}
          </p>
        ) : null}
        {passkeyNotice ? (
          <p role="status" className="status-success mt-4">
            {t(passkeyNotice)}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function toPasskeySettingsItem(passkey: {
  id: string;
  name?: string | null;
  createdAt?: Date | string | null;
  deviceType: string;
  backedUp: boolean;
}): PasskeySettingsItem {
  return {
    id: passkey.id,
    name: passkey.name ?? null,
    createdAt: passkey.createdAt
      ? new Date(passkey.createdAt).toISOString()
      : null,
    deviceType: passkey.deviceType,
    backedUp: passkey.backedUp,
  };
}

function PasswordField({ id, label }: { id: string; label: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        id={id}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="field-input"
      />
    </label>
  );
}

function BackupCodeList({ codes }: { codes: string[] }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {codes.map((backupCode) => (
        <li key={backupCode}>
          <code className="block rounded-lg bg-app-surface px-3 py-2 text-center font-mono text-sm">
            {backupCode}
          </code>
        </li>
      ))}
    </ul>
  );
}
