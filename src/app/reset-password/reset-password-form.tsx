"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "./actions";

const initialState: ResetPasswordActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.reset");
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="space-y-5">
        <p className="status-success" role="status" aria-live="polite">
          {t("success")}
        </p>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-app-foreground underline decoration-app-border-strong underline-offset-4"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="field-label">{t("newPassword")}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="confirmation" className="field-label">
          {t("passwordConfirmation")}
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="field-input"
        />
      </div>
      {state.error ? <p role="alert" className="status-error">{t(`errors.${state.error}`)}</p> : null}
      <Button
        variant="primary"
        type="submit"
        disabled={pending}
        className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
