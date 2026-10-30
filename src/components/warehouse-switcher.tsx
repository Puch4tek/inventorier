"use client";

import { useActionState } from "react";
import { switchWarehouseAction, type SwitchWarehouseState } from "@/app/warehouses/switch-actions";
import { useLocale, useTranslations } from "next-intl";

export function WarehouseSwitcher({
  warehouses,
  activeId,
  mobile = false,
}: {
  warehouses: { id: string; name: string }[];
  activeId?: string;
  mobile?: boolean;
}) {
  const locale = useLocale();
  return (
    <WarehouseSwitcherForm
      key={locale}
      warehouses={warehouses}
      activeId={activeId}
      mobile={mobile}
    />
  );
}

function WarehouseSwitcherForm({
  warehouses,
  activeId,
  mobile,
}: {
  warehouses: { id: string; name: string }[];
  activeId?: string;
  mobile: boolean;
}) {
  const t = useTranslations("organization.warehouseSwitcher");
  const [state, formAction, isPending] = useActionState<SwitchWarehouseState, FormData>(
    switchWarehouseAction,
    {},
  );
  if (warehouses.length === 0) return null;
  return (
    <form action={formAction} className={mobile ? "block sm:hidden" : "hidden sm:block"}>
      <label className="sr-only" htmlFor={mobile ? "mobile-active-warehouse" : "active-warehouse"}>
        {t("label")}
      </label>
      <select
        id={mobile ? "mobile-active-warehouse" : "active-warehouse"}
        name="warehouseId"
        defaultValue={activeId ?? ""}
        disabled={isPending}
        aria-label={t("label")}
        className={mobile
          ? "field-select m-0 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-[16px] font-medium text-app-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent disabled:cursor-default disabled:opacity-70"
          : "field-select m-0 min-w-40 max-w-48 rounded-xl border border-app-border-strong bg-app-surface px-4 py-2 text-sm font-semibold text-app-foreground shadow-sm transition hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent disabled:cursor-default disabled:opacity-70"}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {!activeId ? (
          <option value="" disabled>
            {t("chooseWarehouse")}
          </option>
        ) : null}
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
        ))}
      </select>
      {state.error ? <p role="alert" className="mt-1 text-xs text-app-danger">{state.error}</p> : null}
    </form>
  );
}
