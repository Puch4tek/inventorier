"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateUserRoleAction, type AdminActionState } from "./actions";

const initialState: AdminActionState = {};

export function UserRoleForm({
  userId,
  role,
}: {
  userId: string;
  role: "USER" | "ADMIN";
}) {
  const t = useTranslations("admin.userRole");
  const [state, formAction, isPending] = useActionState(
    updateUserRoleAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        className="field-input field-select mt-0"
        aria-label={t("label")}
      >
        <option value="USER">{t("user")}</option>
        <option value="ADMIN">{t("administrator")}</option>
      </select>
      <Button variant="primary"
        type="submit"
        disabled={isPending}
        className="text-sm font-semibold transition px-3 py-2 text-xs disabled:opacity-50"
      >
        {isPending ? t("saving") : t("save")}
      </Button>
      {state.error ? (
        <span role="alert" className="basis-full text-xs text-app-danger">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span role="status" className="basis-full text-xs text-app-success">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}
