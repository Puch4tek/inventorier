"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  updatePasswordAction,
  updateProfileAction,
  type SettingsActionState,
} from "./actions";

const initialState: SettingsActionState = {};

function changePasswordErrorKey(
  error: SettingsActionState["error"],
):
  | "requiredFields"
  | "passwordMismatch"
  | "passwordTooShort"
  | "passwordSame"
  | "notAuthenticated"
  | "invalidPassword"
  | "alreadyChanged"
  | "generic" {
  switch (error) {
    case "requiredFields":
    case "passwordMismatch":
    case "passwordTooShort":
    case "passwordSame":
    case "notAuthenticated":
    case "invalidPassword":
    case "alreadyChanged":
      return error;
    default:
      return "generic";
  }
}

export function ProfileForm({ name }: { name: string }) {
  const t = useTranslations("auth.settings.profile");
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="settings-name" className="field-label">
          {t("name")}
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
      {state.error ? <p role="alert" className="status-error">{t(`errors.${state.error === "nameRequired" ? "nameRequired" : state.error === "nameTooShort" ? "nameTooShort" : state.error === "nameTooLong" ? "nameTooLong" : "generic"}`)}</p> : null}
      {state.success ? <p role="status" className="status-success">{t("success")}</p> : null}
      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className="px-5 py-3 text-sm disabled:opacity-50"
      >
        {isPending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("auth.settings.password");
  const errorT = useTranslations("auth.changePassword");
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="settings-current-password" className="field-label">
          {t("currentPassword")}
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
          {t("newPassword")}
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
          {t("confirmation")}
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
        {t("otherDevices")}
      </p>
      {state.error ? <p role="alert" className="status-error">{errorT(`errors.${changePasswordErrorKey(state.error)}`)}</p> : null}
      {state.success ? <p role="status" className="status-success">{t("success")}</p> : null}
      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className="px-5 py-3 text-sm disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
