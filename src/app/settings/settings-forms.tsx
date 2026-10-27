"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import {
  updatePasswordAction,
  updateProfileAction,
  type SettingsActionState,
} from "./actions";

const initialState: SettingsActionState = {};

export function ProfileForm({ name }: { name: string }) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="settings-name" className="field-label">
          Imię i nazwisko
        </label>
        <input
          id="settings-name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          required
          className="field-input"
        />
      </div>
      {state.error ? <p role="alert" className="status-error">{state.error}</p> : null}
      {state.success ? <p role="status" className="status-success">{state.success}</p> : null}
      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className="px-5 py-3 text-sm disabled:opacity-50"
      >
        {isPending ? "Zapisywanie..." : "Zapisz dane"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="settings-current-password" className="field-label">
          Obecne hasło
        </label>
        <input
          id="settings-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="settings-new-password" className="field-label">
          Nowe hasło
        </label>
        <input
          id="settings-new-password"
          name="newPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="settings-password-confirmation" className="field-label">
          Powtórz nowe hasło
        </label>
        <input
          id="settings-password-confirmation"
          name="confirmation"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          className="field-input"
        />
      </div>
      <p className="text-sm text-app-muted">
        Zmiana hasła wyloguje Cię na pozostałych urządzeniach.
      </p>
      {state.error ? <p role="alert" className="status-error">{state.error}</p> : null}
      {state.success ? <p role="status" className="status-success">{state.success}</p> : null}
      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className="px-5 py-3 text-sm disabled:opacity-50"
      >
        {isPending ? "Zapisywanie..." : "Zmień hasło"}
      </Button>
    </form>
  );
}
