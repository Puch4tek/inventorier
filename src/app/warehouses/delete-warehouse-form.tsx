"use client";

import { useState, useTransition } from "react";
import { deleteWarehouseAction } from "./actions";

export function DeleteWarehouseForm({
  warehouseId,
  warehouseName,
  disabled = false,
}: {
  warehouseId: string;
  warehouseName: string;
  disabled?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        if (!confirmed) {
          event.preventDefault();
          setConfirmed(true);
          return;
        }
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await deleteWarehouseAction(formData);
            setState({ success: "Magazyn został usunięty." });
          } catch (error) {
            setState({
              error:
                error instanceof Error
                  ? error.message
                  : "Nie udało się usunąć magazynu.",
            });
          }
        });
      }}
    >
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input
        name="confirmationName"
        required
        placeholder={warehouseName}
        className="field-input"
        aria-label="Nazwa magazynu"
      />
      {confirmed ? (
        <p className="mt-3 rounded-xl bg-app-danger-surface px-4 py-3 text-sm text-app-danger">
          Kliknij ponownie, aby trwale usunąć magazyn i jego dane.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || isPending}
        className="mt-3 inline-flex rounded-xl border border-app-danger bg-app-danger px-4 py-3 text-sm font-semibold text-app-inverse hover:opacity-90"
      >
        {isPending ? "Usuwanie..." : confirmed ? "Potwierdź usunięcie" : "Usuń magazyn"}
      </button>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-app-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-3 text-sm text-app-success">{state.success}</p>
      ) : null}
    </form>
  );
}
