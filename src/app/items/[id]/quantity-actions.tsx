"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeItemQuantityDirectAction,
  type ItemActionState,
} from "../actions";

export function QuantityActions({
  itemId,
  quantity,
}: {
  itemId: number;
  quantity: number;
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
    <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-medium text-[#6e6e73]">Szybka zmiana ilości</p>
      <p className="mt-2 text-3xl font-semibold">{quantity}</p>
      <p className="mt-1 text-sm text-[#6e6e73]">
        Użyj przycisków podczas pracy w terenie albo wpisz nową ilość.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <form action={submit}>
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="delta" value="-1" />
          <button type="submit" disabled={isPending || quantity === 0} className="rounded-xl border border-black/[0.12] px-5 py-3 text-lg font-semibold transition hover:bg-[#f5f5f7] disabled:cursor-not-allowed disabled:opacity-40">
            −1
          </button>
        </form>
        <form action={submit}>
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="delta" value="1" />
          <button type="submit" disabled={isPending} className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-lg font-semibold text-white transition hover:bg-[#424245] disabled:cursor-not-allowed disabled:opacity-50">
            +1
          </button>
        </form>
        <form action={submit} className="flex flex-1 gap-3">
          <input type="hidden" name="id" value={itemId} />
          <label htmlFor="exact-quantity" className="sr-only">Nowa ilość</label>
          <input id="exact-quantity" name="quantity" type="number" min="0" step="1" defaultValue={quantity} className="field-input mt-0 min-w-0 flex-1" />
          <button type="submit" disabled={isPending} className="rounded-xl border border-black/[0.12] px-4 py-3 text-sm font-semibold transition hover:bg-[#f5f5f7] disabled:cursor-not-allowed disabled:opacity-50">
            Ustaw
          </button>
        </form>
      </div>

      {state.error ? <p role="alert" className="mt-4 rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">{state.error}</p> : null}
    </section>
  );
}
