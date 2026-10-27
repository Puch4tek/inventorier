"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { setRegistrationEnabledAction, type AdminActionState } from "./actions";

const initialState: AdminActionState = {};

export function RegistrationSettingsForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, isPending] = useActionState(
    setRegistrationEnabledAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
      <p className="text-sm">
        Status:{" "}
        <span className={enabled ? "font-semibold text-app-success" : "font-semibold text-app-danger"}>
          {enabled ? "Włączona" : "Wyłączona"}
        </span>
      </p>
      <Button
        variant="secondary"
        type="submit"
        disabled={isPending}
        className="mt-3 px-4 py-2 text-sm disabled:opacity-50"
      >
        {isPending ? "Zapisywanie..." : enabled ? "Wyłącz rejestrację" : "Włącz rejestrację"}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-app-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-3 text-sm text-app-success">{state.success}</p>
      ) : null}
    </form>
  );
}
