"use client";

import { useActionState } from "react";
import { newLocationAction, type NewLocationActionState } from "./actions";
import Link from "next/link";

const initialState: NewLocationActionState = {};

export function NewLocationForm() {
  const [state, formAction, isPending] = useActionState(
    newLocationAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">
          Nazwa lokalizacji
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="field-input"
          placeholder="np. Magazyn"
        />
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Opis <span className="text-[#6e6e73]">(opcjonalnie)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="field-input resize-none"
          placeholder="Krótki opis lokalizacji"
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">
          {state.error}
        </p>
      ) : null}

      {state.id ? (
        <p role="status" className="rounded-xl bg-[#effaf3] px-4 py-3 text-sm text-[#18794e]">
          Lokalizacja została utworzona.
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/locations"
          className="rounded-xl border border-black/[0.12] px-5 py-3 text-center text-sm font-semibold text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
        >
          Anuluj
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Zapisywanie..." : "Dodaj lokalizację"}
        </button>
      </div>
    </form>
  );
}

export default function NewLocationPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 py-8 text-[#1d1d1f] sm:px-8 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-black/[0.06] bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-12">
        <p className="text-sm font-medium text-[#6e6e73]">Lokalizacje</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          Dodaj lokalizację
        </h1>
        <p className="mt-3 mb-8 text-[15px] leading-6 text-[#6e6e73]">
          Utwórz miejsce, w którym przechowujesz swoje przedmioty.
        </p>
        <NewLocationForm />
      </section>
    </main>
  );
}