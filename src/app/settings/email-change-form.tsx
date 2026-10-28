"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";

export function EmailChangeForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await authClient.changeEmail({
          newEmail: newEmail.trim(),
          callbackURL: "/settings?tab=email&emailChange=success",
        });
        if (result.error) {
          setError("Nie udało się wysłać linku potwierdzającego. Sprawdź adres i spróbuj ponownie.");
          return;
        }
        setNewEmail("");
        setNotice("Jeśli adres jest dostępny, wysłaliśmy na niego link potwierdzający. Obecny adres pozostaje bez zmian do czasu potwierdzenia.");
      } catch {
        setError("Nie udało się wysłać linku potwierdzającego. Spróbuj ponownie.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="field-label">Obecny adres e-mail</p>
        <p className="mt-2 rounded-xl bg-app-surface-muted px-4 py-3 text-sm text-app-muted">
          {currentEmail}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="new-account-email" className="field-label">
            Nowy adres e-mail
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
        {error ? <p role="alert" className="status-error">{error}</p> : null}
        {notice ? <p role="status" className="status-success">{notice}</p> : null}
        <Button type="submit" disabled={pending} className="px-5 py-3 text-sm disabled:opacity-50">
          {pending ? "Wysyłanie..." : "Wyślij link potwierdzający"}
        </Button>
      </form>
    </div>
  );
}
