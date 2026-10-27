"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "./actions";

const initialState: CreateUserState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">
          Imię i nazwisko
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="field-input"
          placeholder="Jan Kowalski"
        />
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          Adres e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-input"
          placeholder="jan@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field-input"
          placeholder="Minimum 8 znaków"
        />
      </div>

      <div>
        <label htmlFor="passwordConfirmation" className="field-label">
          Powtórz hasło
        </label>
        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field-input"
          placeholder="Wpisz hasło ponownie"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="status-error"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="status-success"
        >
          {state.success}
        </p>
      ) : null}

      <Button variant="primary"
        type="submit"
        disabled={isPending}
        className="px-5 text-sm font-semibold transition w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Tworzenie konta..." : "Utwórz konto"}
      </Button>
    </form>
  );
}
