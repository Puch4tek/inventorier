"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { createWarehouseAction, type WarehouseActionState } from "./actions";

export function WarehouseForm() {
  const [state, formAction, isPending] = useActionState<WarehouseActionState, FormData>(
    createWarehouseAction,
    {},
  );
  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="warehouse-name" className="field-label">Nazwa magazynu</label>
        <input id="warehouse-name" name="name" required className="field-input" />
      </div>
      <Button type="submit" disabled={isPending} className="px-4 py-3 text-sm disabled:opacity-50">
        {isPending ? "Tworzenie..." : "Utwórz magazyn"}
      </Button>
      {state.error ? <p role="alert" className="text-xs text-app-danger">{state.error}</p> : null}
      {state.success ? <p role="status" className="text-xs text-app-success">{state.success}</p> : null}
    </form>
  );
}
