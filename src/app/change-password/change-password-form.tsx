"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePasswordAction, type ChangePasswordActionState } from "./actions";

const initialState: ChangePasswordActionState = {};

export function ChangePasswordForm({ next }: { next?: string }) {
  const t = useTranslations("auth.changePassword");
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label htmlFor="currentPassword" className="field-label">{t("currentPassword")}</label>
        <input id="currentPassword" name="currentPassword" type="password" required className="field-input" />
      </div>
      <div>
        <label htmlFor="newPassword" className="field-label">{t("newPassword")}</label>
        <input id="newPassword" name="newPassword" type="password" minLength={8} required className="field-input" />
      </div>
      <div>
        <label htmlFor="confirmation" className="field-label">{t("passwordConfirmation")}</label>
        <input id="confirmation" name="confirmation" type="password" minLength={8} required className="field-input" />
      </div>
      <p className="text-sm text-app-muted">
        {t("otherDevices")}
      </p>
      {state.error ? <p role="alert" className="status-error">{t(`errors.${state.error}`)}</p> : null}
      <Button variant="primary" type="submit" disabled={isPending} className="px-5 text-sm font-semibold transition w-full py-3.5 disabled:opacity-50">
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
