"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";

export function EmailChangeForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const t = useTranslations("auth.settings.email");
  const [newEmail, setNewEmail] = useState("");
  const [hasError, setHasError] = useState(false);
  const [hasNotice, setHasNotice] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasError(false);
    setHasNotice(false);
    startTransition(async () => {
      try {
        const result = await authClient.changeEmail({
          newEmail: newEmail.trim(),
          callbackURL: "/settings?tab=email&emailChange=success",
        });
        if (result.error) {
          setHasError(true);
          return;
        }
        setNewEmail("");
        setHasNotice(true);
      } catch {
        setHasError(true);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="field-label">{t("current")}</p>
        <p className="mt-2 rounded-xl bg-app-surface-muted px-4 py-3 text-sm text-app-muted">
          {currentEmail}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="new-account-email" className="field-label">
            {t("new")}
          </label>
          <input
            id="new-account-email"
            name="newEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            className="field-input"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
        </div>
        {hasError ? <p role="alert" className="status-error">{t("errors.sendFailed")}</p> : null}
        {hasNotice ? <p role="status" className="status-success">{t("success")}</p> : null}
        <Button type="submit" disabled={pending} className="px-5 py-3 text-sm disabled:opacity-50">
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
