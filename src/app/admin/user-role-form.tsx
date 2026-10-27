"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { updateUserRoleAction, type AdminActionState } from "./actions";

const initialState: AdminActionState = {};

export function UserRoleForm({
  userId,
  role,
}: {
  userId: string;
  role: "USER" | "ADMIN";
}) {
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
        aria-label="Rola systemowa użytkownika"
      >
        <option value="USER">Użytkownik</option>
        <option value="ADMIN">Administrator</option>
      </select>
      <Button variant="primary"
        type="submit"
        disabled={isPending}
        className="text-sm font-semibold transition px-3 py-2 text-xs disabled:opacity-50"
      >
        {isPending ? "Zapisywanie..." : "Zapisz"}
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
