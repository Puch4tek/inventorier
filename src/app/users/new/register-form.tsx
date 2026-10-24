"use client";

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
          className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="rounded-xl bg-[#effaf3] px-4 py-3 text-sm text-[#18794e]"
        >
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#1d1d1f] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#424245] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Tworzenie konta..." : "Utwórz konto"}
      </button>
    </form>
  );
}
