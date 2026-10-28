"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/button";
import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "./actions";

const initialState: ForgotPasswordActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.submitted) {
    return (
      <div className="space-y-5">
        <p className="status-success" role="status" aria-live="polite">
          Jeśli konto z podanym adresem może zresetować hasło, wyślemy na niego
          instrukcję. Sprawdź pocztę.
        </p>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-app-foreground underline decoration-app-border-strong underline-offset-4"
        >
          Wróć do logowania
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="field-label">Adres e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          className="field-input"
          placeholder="Wprowadź adres e-mail"
        />
      </div>
      {state.error ? <p role="alert" className="status-error">{state.error}</p> : null}
      <Button
        variant="primary"
        type="submit"
        disabled={pending}
        className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Wysyłanie..." : "Wyślij instrukcję"}
      </Button>
      <p className="text-center text-sm text-app-muted">
        <Link href="/login" className="underline underline-offset-4">
          Wróć do logowania
        </Link>
      </p>
    </form>
  );
}
