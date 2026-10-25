"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, type CreateCategoryState } from "./actions";

const initialState: CreateCategoryState = {};

export function CategoryCreateModal() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  function close() {
    setOpen(false);
    setKey((value) => value + 1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="primary-button"
      >
        Dodaj kategorię
      </button>
      {open ? <CategoryDialog key={key} onClose={close} /> : null}
    </>
  );
}

function CategoryDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    createCategoryAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.id) {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="panel-card w-full max-w-lg rounded-[2rem] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-[#6e6e73]">Kategorie</p>
            <h2 className="mt-2 text-2xl font-semibold">Dodaj kategorię</h2>
          </div>
          <button type="button" aria-label="Zamknij" onClick={onClose} className="rounded-full px-3 py-1 text-2xl text-[#6e6e73] hover:bg-[#f5f5f7]">
            &times;
          </button>
        </div>
        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="category-name" className="field-label">Nazwa</label>
            <input id="category-name" name="name" required className="field-input" placeholder="np. Narzędzia" />
          </div>
          <div>
            <label htmlFor="category-description" className="field-label">Opis <span className="text-[#6e6e73]">(opcjonalnie)</span></label>
            <textarea id="category-description" name="description" rows={4} className="field-input resize-none" />
          </div>
          {state.error ? <p role="alert" className="status-error">{state.error}</p> : null}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="secondary-button">Anuluj</button>
            <button type="submit" disabled={isPending} className="primary-button disabled:opacity-50">
              {isPending ? "Zapisywanie..." : "Dodaj kategorię"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
