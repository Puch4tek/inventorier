"use client";

import { Button } from "@/components/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeItemQuantityDirectAction,
  type ItemActionState,
} from "../actions";

export function QuantityActions({
  itemId,
  quantity,
  inputId = "exact-quantity",
}: {
  itemId: number;
  quantity: number;
  inputId?: string;
}) {
  const [state, setState] = useState<ItemActionState>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    startTransition(async () => {
      const nextState = await changeItemQuantityDirectAction(formData);
      setState(nextState);
      if (nextState.success) {
        router.refresh();
      }
    });
  }

  return (
    <section className="panel-card rounded-2xl p-3 sm:rounded-3xl sm:p-6">
      <p className="text-xs font-medium text-app-muted sm:text-sm">Ilość</p>
      <p className="mt-1 hidden text-sm text-app-muted sm:block">
        Użyj przycisków podczas pracy w terenie albo wpisz nową ilość.
      </p>

      <div className="mt-2 flex w-full items-center gap-1 sm:mt-5 sm:gap-3">
        <form action={submit}>
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="delta" value="-1" />
          <button type="submit" disabled={isPending || quantity === 0} className="h-10 w-10 rounded-lg border border-app-border bg-app-surface p-0 text-sm font-semibold text-app-foreground transition hover:bg-app-surface-muted disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
            −1
          </button>
        </form>
        <form action={submit}>
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="delta" value="1" />
          <Button type="submit" variant="primary" disabled={isPending} className="h-10 w-10 rounded-lg p-0 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
            +1
          </Button>
        </form>
        <form action={submit} className="flex min-w-0 flex-1 gap-1 sm:gap-3">
          <input type="hidden" name="id" value={itemId} />
          <label htmlFor={inputId} className="sr-only">Nowa ilość</label>
          <input id={inputId} name="quantity" type="number" min="0" step="1" defaultValue={quantity} className="field-input mt-0 min-w-0 flex-1 px-2 py-2 text-center sm:px-3 sm:py-3" />
          <button type="submit" disabled={isPending} className="rounded-lg border border-app-border-strong px-2.5 py-2 text-xs font-semibold transition hover:bg-app-surface-muted disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
            Ustaw
          </button>
        </form>
      </div>

      {state.error ? <p role="alert" className="status-error mt-4">{state.error}</p> : null}
    </section>
  );
}
