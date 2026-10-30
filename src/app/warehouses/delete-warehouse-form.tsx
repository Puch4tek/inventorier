"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteWarehouseAction } from "./actions";
import type { WarehouseActionState } from "./actions";

export function DeleteWarehouseForm({
  warehouseId,
  warehouseName,
  disabled = false,
}: {
  warehouseId: string;
  warehouseName: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin.deleteWarehouse");
  const errorT = useTranslations("admin.actions.errors");
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<WarehouseActionState>({});
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
            setState(await deleteWarehouseAction(formData));
          } catch {
            setState({ error: errorT("deleteWarehouse") });
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
        aria-label={t("nameLabel")}
      />
      {confirmed ? (
        <p className="mt-3 rounded-xl bg-app-danger-surface px-4 py-3 text-sm text-app-danger">
          {t("confirmWarning")}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || isPending}
        className="mt-3 inline-flex rounded-xl border border-app-danger bg-app-danger px-4 py-3 text-sm font-semibold text-app-inverse hover:opacity-90"
      >
        {isPending ? t("deleting") : confirmed ? t("confirm") : t("delete")}
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
