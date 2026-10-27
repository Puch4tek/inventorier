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
import type { SecuritySettingsData } from "@/server/security/get-security-settings";
import {
  authorizePasskeyManagement,
  beginTotpSetup,
  cancelPendingTotpSetup,
  confirmTotpSetup,
  disableTotp,
  regenerateBackupCodes,
} from "./security-actions";
import { authClient } from "@/lib/auth-client";

type TotpSetupState = {
  totpURI: string;
  backupCodes: string[];
};

type PasskeySettingsItem = SecuritySettingsData["passkeys"][number];

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
}: {
  initialSettings: SecuritySettingsData;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [setup, setSetup] = useState<TotpSetupState | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyNotice, setPasskeyNotice] = useState("");
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
    setError("");
    setNotice("");
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
      setNotice("Zeskanuj kod, zapisz kody zapasowe i potwierdź kod z aplikacji.");
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
      setNotice("Uwierzytelnianie TOTP zostało włączone.");
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
      setNotice("Niedokończona konfiguracja TOTP została anulowana.");
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
      setNotice("Poprzednie kody zapasowe zostały unieważnione.");
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
      setNotice("Uwierzytelnianie TOTP zostało wyłączone.");
    });
  }

  function authorizePasskey(password: string) {
    return authorizePasskeyManagement(password);
  }

  function handleAddPasskey(formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    setPasskeyError("");
    setPasskeyNotice("");
    run(async () => {
      if (webauthnAvailable !== true) {
        setPasskeyError("Ta przeglądarka lub urządzenie nie obsługuje WebAuthn.");
        return;
      }
      if (!name || name.length > 64) {
        setPasskeyError("Podaj nazwę passkey (maksymalnie 64 znaki).");
        return;
      }

      const authorization = await authorizePasskey(currentPassword);
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
        setPasskeyError("Nie udało się dodać passkey. Spróbuj ponownie.");
        return;
      }
      if (result.error || !result.data) {
        setPasskeyError(
          result.error?.message || "Nie udało się dodać passkey.",
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
      setPasskeyNotice("Passkey został dodany.");
    });
  }

  function handleRenamePasskey(passkeyId: string, formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    setPasskeyError("");
    setPasskeyNotice("");
    run(async () => {
      if (!name || name.length > 64) {
        setPasskeyError("Podaj nazwę passkey (maksymalnie 64 znaki).");
        return;
      }

      const authorization = await authorizePasskey(currentPassword);
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
        setPasskeyError("Nie udało się zmienić nazwy passkey. Spróbuj ponownie.");
        return;
      }
      if (result.error || !result.data?.passkey) {
        setPasskeyError(
          result.error?.message || "Nie udało się zmienić nazwy passkey.",
        );
        return;
      }

      setSettings((current) => ({
        ...current,
        passkeys: current.passkeys.map((item) =>
          item.id === passkeyId ? { ...item, name: result.data.passkey.name ?? name } : item,
        ),
      }));
      setPasskeyNotice("Nazwa passkey została zmieniona.");
    });
  }

  function handleDeletePasskey(passkeyId: string, formData: FormData) {
    const currentPassword = String(formData.get("password") ?? "");
    setPasskeyError("");
    setPasskeyNotice("");
    run(async () => {
      const authorization = await authorizePasskey(currentPassword);
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
        setPasskeyError("Nie udało się usunąć passkey. Spróbuj ponownie.");
        return;
      }
      if (result.error || result.data?.status !== true) {
        setPasskeyError(
          result.error?.message || "Nie udało się usunąć passkey.",
        );
        return;
      }

      setSettings((current) => ({
        ...current,
        passkeys: current.passkeys.filter((item) => item.id !== passkeyId),
      }));
      setPasskeyNotice("Passkey został usunięty.");
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">
            Uwierzytelnianie dwuskładnikowe
          </h2>
          <p className="mt-2 text-sm text-app-muted">
            Zabezpiecz konto kodem z aplikacji uwierzytelniającej i kodami
            zapasowymi.
          </p>
        </div>

        <p className="mb-5 text-sm">
          Status:{" "}
          <strong>
            {settings.twoFactorEnabled
              ? "włączone"
              : settings.totpSetupPending
                ? "konfiguracja oczekuje na potwierdzenie"
                : "wyłączone"}
          </strong>
        </p>

        {!settings.twoFactorEnabled && !settings.totpSetupPending && !setup ? (
          <form action={handleBeginSetup} className="space-y-4">
            <PasswordField
              id="mfa-enable-password"
              label="Obecne hasło"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={isPending}
              className="px-5 py-3 text-sm disabled:opacity-50"
            >
              {isPending ? "Przygotowywanie..." : "Skonfiguruj TOTP"}
            </Button>
          </form>
        ) : null}

        {setup ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-app-border bg-app-surface-muted p-4">
              <p className="mb-3 text-sm font-semibold">
                Zeskanuj kod w aplikacji uwierzytelniającej
              </p>
              {qrSvg ? (
                <Image
                  className="inline-block rounded-lg bg-white p-3"
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
                  alt="Lokalnie wygenerowany kod QR do konfiguracji TOTP"
                  width={220}
                  height={220}
                  unoptimized
                />
              ) : (
                <p className="text-sm text-app-muted">
                  Nie udało się wygenerować kodu QR. Wprowadź adres ręcznie:
                </p>
              )}
              <p className="mt-3 break-all font-mono text-xs text-app-muted">
                {setup.totpURI}
              </p>
            </div>
            <div className="rounded-xl border border-app-warning/30 bg-app-warning-surface p-4">
              <p className="font-semibold">Zapisz kody zapasowe teraz</p>
              <p className="mt-1 text-sm text-app-muted">
                Nie będą ponownie wyświetlone. Każdy kod można użyć tylko raz.
              </p>
              <BackupCodeList codes={setup.backupCodes} />
            </div>
            <form action={handleConfirmSetup} className="space-y-4">
              <label className="block">
                <span className="field-label">Kod z aplikacji</span>
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
              <PasswordField id="mfa-confirm-password" label="Obecne hasło" />
              <Button
                variant="primary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                {isPending ? "Weryfikowanie..." : "Potwierdź i włącz"}
              </Button>
            </form>
          </div>
        ) : null}

        {settings.totpSetupPending && !setup ? (
          <div className="space-y-4">
            <p className="text-sm text-app-muted">
              Konfiguracja rozpoczęto, ale kod nie został jeszcze potwierdzony.
              Wprowadź kod z aplikacji lub anuluj tę konfigurację.
            </p>
            <form action={handleConfirmSetup} className="space-y-4">
              <label className="block">
                <span className="field-label">Kod z aplikacji</span>
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
              <PasswordField id="mfa-resume-password" label="Obecne hasło" />
              <Button
                variant="primary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                Potwierdź konfigurację
              </Button>
            </form>
            <form action={handleCancelSetup} className="space-y-4">
              <PasswordField
                id="mfa-cancel-password"
                label="Hasło, aby anulować konfigurację"
              />
              <Button
                variant="secondary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                Anuluj konfigurację
              </Button>
            </form>
          </div>
        ) : null}

        {settings.twoFactorEnabled ? (
          <div className="space-y-5">
            <form action={handleRegenerateCodes} className="space-y-4">
              <p className="text-sm text-app-muted">
                Wygenerowanie nowych kodów natychmiast unieważni poprzednie.
              </p>
              <PasswordField
                id="mfa-backup-password"
                label="Obecne hasło"
              />
              <Button
                variant="secondary"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                Wygeneruj nowe kody zapasowe
              </Button>
            </form>
            <form action={handleDisableTotp} className="space-y-4 border-t border-app-border pt-5">
              <p className="text-sm text-app-muted">
                Wyłączenie TOTP usuwa zaufane urządzenia tego konta.
              </p>
              <PasswordField id="mfa-disable-password" label="Obecne hasło" />
              <Button
                variant="danger"
                type="submit"
                disabled={isPending}
                className="px-5 py-3 text-sm disabled:opacity-50"
              >
                Wyłącz TOTP
              </Button>
            </form>
          </div>
        ) : null}

        {backupCodes ? (
          <div className="mt-5 rounded-xl border border-app-warning/30 bg-app-warning-surface p-4">
            <p className="font-semibold">Nowe kody zapasowe</p>
            <p className="mt-1 text-sm text-app-muted">
              Zapisz je w bezpiecznym miejscu. Nie będą ponownie wyświetlone.
            </p>
            <BackupCodeList codes={backupCodes} />
          </div>
        ) : null}

        {error ? <p role="alert" className="status-error mt-4">{error}</p> : null}
        {notice ? <p role="status" className="status-success mt-4">{notice}</p> : null}
      </section>

      <section className="panel-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Passkeys</h2>
          <p className="mt-2 text-sm text-app-muted">
            Klucze dostępu zapisane na tym koncie.
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
                    {passkey.name || "Passkey bez nazwy"}
                  </p>
                  <p className="mt-1 text-sm text-app-muted">
                    {passkey.deviceType === "multiDevice"
                      ? "Synchronizowany"
                      : "Powiązany z urządzeniem"}
                    {passkey.backedUp ? " · kopia zapasowa dostępna" : ""}
                    {passkey.createdAt
                      ? ` · dodano ${new Intl.DateTimeFormat("pl-PL", {
                          dateStyle: "medium",
                        }).format(new Date(passkey.createdAt))}`
                      : ""}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <form
                    action={(formData) =>
                      handleRenamePasskey(passkey.id, formData)
                    }
                    className="space-y-3"
                  >
                    <label className="block">
                      <span className="field-label">Zmień nazwę</span>
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
                      label="Obecne hasło"
                    />
                    <Button
                      variant="secondary"
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2.5 text-sm disabled:opacity-50"
                    >
                      Zmień nazwę
                    </Button>
                  </form>
                  <form
                    action={(formData) =>
                      handleDeletePasskey(passkey.id, formData)
                    }
                    className="space-y-3"
                  >
                    <div className="field-label">Usuń passkey</div>
                    <p className="text-sm text-app-muted">
                      Aby usunąć ten klucz, potwierdź obecne hasło.
                    </p>
                    <PasswordField
                      id={`passkey-delete-password-${passkey.id}`}
                      label="Obecne hasło"
                    />
                    <Button
                      variant="danger"
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2.5 text-sm disabled:opacity-50"
                    >
                      Usuń passkey
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-app-muted">Nie dodano jeszcze żadnego passkey.</p>
        )}
        {webauthnAvailable === false ? (
          <p className="status-error mt-5">
            Ta przeglądarka lub urządzenie nie obsługuje WebAuthn.
          </p>
        ) : null}
        {webauthnAvailable !== false ? (
          <form action={handleAddPasskey} className="mt-6 space-y-4 border-t border-app-border pt-5">
            <h3 className="font-semibold">Dodaj passkey</h3>
            <label className="block">
              <span className="field-label">Nazwa klucza</span>
              <input
                name="name"
                maxLength={64}
                required
                autoComplete="off"
                className="field-input"
                placeholder="np. Telefon służbowy"
              />
            </label>
            <PasswordField
              id="passkey-add-password"
              label="Obecne hasło"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={isPending || webauthnAvailable !== true}
              className="px-5 py-3 text-sm disabled:opacity-50"
            >
              {isPending ? "Oczekiwanie na urządzenie..." : "Dodaj passkey"}
            </Button>
          </form>
        ) : null}
        {passkeyError ? (
          <p role="alert" className="status-error mt-4">
            {passkeyError}
          </p>
        ) : null}
        {passkeyNotice ? (
          <p role="status" className="status-success mt-4">
            {passkeyNotice}
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
