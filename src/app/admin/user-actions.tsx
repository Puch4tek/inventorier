"use client";

import { useActionState } from "react";
import {
  deleteUserAction,
  resetUserPasswordAction,
  type AdminActionState,
} from "./actions";

const initialState: AdminActionState = {};

export function UserActions({ userId }: { userId: number }) {
  const [resetState, resetAction, isResetting] = useActionState(
    resetUserPasswordAction,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteUserAction,
    initialState,
  );

  return (
    <div className="mt-4 space-y-3 border-t border-black/[0.06] pt-4">
      <form action={resetAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="Nowe hasło (min. 8 znaków)"
          className="min-w-52 flex-1 rounded-lg border border-black/[0.12] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isResetting}
          className="secondary-button px-3 py-2 text-xs disabled:opacity-50"
        >
          {isResetting ? "Resetowanie..." : "Resetuj hasło"}
        </button>
      </form>
      {resetState.error ? <p role="alert" className="text-xs text-[#b42318]">{resetState.error}</p> : null}
      {resetState.success ? <p role="status" className="text-xs text-[#18794e]">{resetState.success}</p> : null}
      <form action={deleteAction}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={isDeleting}
          className="danger-button px-3 py-2 text-xs disabled:opacity-50"
        >
          {isDeleting ? "Usuwanie..." : "Usuń użytkownika"}
        </button>
      </form>
      {deleteState.error ? <p role="alert" className="text-xs text-[#b42318]">{deleteState.error}</p> : null}
      {deleteState.success ? <p role="status" className="text-xs text-[#18794e]">{deleteState.success}</p> : null}
    </div>
  );
}
