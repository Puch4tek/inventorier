"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createUserAction, type CreateUserState } from "./actions";

const initialState: CreateUserState = {};

export function RegisterForm() {
  const t = useTranslations("auth.registration");
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="field-input"
          placeholder={t("namePlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-input"
          placeholder={t("emailPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field-input"
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="passwordConfirmation" className="field-label">
          {t("passwordConfirmation")}
        </label>
        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field-input"
          placeholder={t("passwordConfirmationPlaceholder")}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="status-error"
        >
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="status-success"
        >
          {t("success")}
        </p>
      ) : null}

      <Button variant="primary"
        type="submit"
        disabled={isPending}
        className="px-5 text-sm font-semibold transition w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
