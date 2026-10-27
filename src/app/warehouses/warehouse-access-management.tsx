"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import {
  removeWarehouseMemberAction,
  setWarehouseMemberRoleAction,
  type WarehouseActionState,
} from "./actions";

type WarehouseSummary = { id: string; name: string; slug: string };
type WarehouseAccessManagementData = {
  warehouse: WarehouseSummary;
  users: Array<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    globalRole: "USER" | "ADMIN";
    warehouseRole: "USER" | "MANAGER" | null;
  }>;
};

const initialState: WarehouseActionState = {};

export function WarehouseAccessManagement({
  data,
  currentUserId,
  isAdmin,
}: {
  data: WarehouseAccessManagementData;
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <section className="panel-card mt-8 overflow-hidden">
      <div className="border-b border-app-border p-5 sm:p-6">
        <p className="page-kicker">Dostęp do magazynu</p>
        <h2 className="mt-1 text-xl font-semibold">{data.warehouse.name}</h2>
        <p className="mt-2 text-sm text-app-muted">
          Nadaj dostęp użytkownikom instancji. Lista pokazuje wyłącznie rolę w tym magazynie.
        </p>
      </div>
      <div className="divide-y divide-app-border">
        {data.users.map((user) => {
          const canEdit =
            user.globalRole !== "ADMIN" &&
            (isAdmin || user.id !== currentUserId);

          return (
            <article
              key={user.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="mt-1 truncate text-sm text-app-muted">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={user.isActive ? "text-app-success" : "text-app-danger"}>
                    {user.isActive ? "Aktywne konto" : "Konto zablokowane"}
                  </span>
                  {user.globalRole === "ADMIN" ? (
                    <span className="text-app-subtle">Administrator globalny</span>
                  ) : null}
                  {user.id === currentUserId && !isAdmin ? (
                    <span className="text-app-subtle">Twoje przypisanie</span>
                  ) : null}
                </div>
              </div>
              <div className="w-full sm:max-w-sm">
                {user.globalRole === "ADMIN" ? (
                  <p className="text-sm font-medium text-app-muted">
                    Administrator — pełny dostęp
                  </p>
                ) : (
                  <MemberRoleForm
                    warehouseId={data.warehouse.id}
                    userId={user.id}
                    role={user.warehouseRole}
                    canEdit={canEdit}
                  />
                )}
              </div>
            </article>
          );
        })}
        {data.users.length === 0 ? (
          <p className="p-5 text-sm text-app-muted">Brak kont do wyświetlenia.</p>
        ) : null}
      </div>
    </section>
  );
}

function MemberRoleForm({
  warehouseId,
  userId,
  role,
  canEdit,
}: {
  warehouseId: string;
  userId: string;
  role: "USER" | "MANAGER" | null;
  canEdit: boolean;
}) {
  const [state, formAction, isPending] = useActionState<WarehouseActionState, FormData>(
    setWarehouseMemberRoleAction,
    initialState,
  );
  const [removeState, removeAction, isRemoving] = useActionState<
    WarehouseActionState,
    FormData
  >(removeWarehouseMemberAction, initialState);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="warehouseId" value={warehouseId} />
        <input type="hidden" name="userId" value={userId} />
        <label className="sr-only" htmlFor={`warehouse-role-${warehouseId}-${userId}`}>
          Rola użytkownika w magazynie
        </label>
        <select
          id={`warehouse-role-${warehouseId}-${userId}`}
          name="role"
          defaultValue={role ?? ""}
          required
          disabled={!canEdit || isPending}
          className="field-input field-select mt-0 min-w-36 flex-1"
        >
          {!role ? (
            <option value="" disabled>
              Brak dostępu
            </option>
          ) : null}
          <option value="USER">Użytkownik</option>
          <option value="MANAGER">Menedżer</option>
        </select>
        <Button
          variant="secondary"
          type="submit"
          disabled={!canEdit || isPending}
          className="px-3 py-2 text-xs"
        >
          {isPending ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </form>
      {role && canEdit ? (
        <form action={removeAction} className="mt-2">
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            disabled={isRemoving}
            className="text-xs font-semibold text-app-danger hover:underline disabled:opacity-50"
          >
            {isRemoving ? "Usuwanie dostępu..." : "Odbierz dostęp"}
          </button>
        </form>
      ) : null}
      {state.error ? <p role="alert" className="mt-2 text-xs text-app-danger">{state.error}</p> : null}
      {state.success ? <p role="status" className="mt-2 text-xs text-app-success">{state.success}</p> : null}
      {removeState.error ? <p role="alert" className="mt-2 text-xs text-app-danger">{removeState.error}</p> : null}
      {removeState.success ? <p role="status" className="mt-2 text-xs text-app-success">{removeState.success}</p> : null}
      {!canEdit ? (
        <p className="mt-2 text-xs text-app-muted">
          {role ? `Rola: ${role === "MANAGER" ? "menedżer" : "użytkownik"}` : "Brak dostępu"}
        </p>
      ) : null}
    </div>
  );
}
