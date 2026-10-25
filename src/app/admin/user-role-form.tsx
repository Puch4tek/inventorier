"use client";

import { useActionState } from "react";
import { updateUserRoleAction, type AdminActionState } from "./actions";

const initialState: AdminActionState = {};

export function UserRoleForm({
  userId,
  role,
}: {
  userId: number;
  role: "USER" | "MANAGER" | "ADMIN";
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
        className="rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-sm"
        aria-label="Rola użytkownika"
      >
        <option value="USER">Użytkownik</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Administrator</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[#1d1d1f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#424245] disabled:opacity-50"
      >
        {isPending ? "Zapisywanie..." : "Zapisz"}
      </button>
      {state.error ? (
        <span role="alert" className="basis-full text-xs text-[#b42318]">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span role="status" className="basis-full text-xs text-[#18794e]">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}

