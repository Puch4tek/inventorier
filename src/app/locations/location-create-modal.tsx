"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  newLocationAction,
  type NewLocationActionState,
} from "./new/actions";

const initialState: NewLocationActionState = {};

type LocationOption = {
  id: number;
  name: string;
  parentId: number | null;
};

type LocationCreateModalProps = {
  locations: LocationOption[];
};

export function LocationCreateModal({
  locations,
}: LocationCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  const refreshLocations = useCallback(() => {
    router.refresh();
  }, [router]);

  function closeModal() {
    setIsOpen(false);
    setFormKey((key) => key + 1);
  }

  function openModal() {
    setFormKey((key) => key + 1);
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="primary-button"
      >
        Dodaj lokalizację
      </button>

      {isOpen ? (
        <LocationCreateDialog
          key={formKey}
          locations={locations}
          onClose={closeModal}
          onCreated={refreshLocations}
          onReset={() => setFormKey((key) => key + 1)}
        />
      ) : null}
    </>
  );
}

function LocationCreateDialog({
  locations,
  onClose,
  onCreated,
  onReset,
}: LocationCreateModalProps & {
  onClose: () => void;
  onCreated: () => void;
  onReset: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    newLocationAction,
    initialState,
  );

  useEffect(() => {
    if (state.id) {
      onCreated();
    }
  }, [onCreated, state.id]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-8 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isPending) {
            onClose();
          }
        }}
      >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-modal-title"
            className="panel-card w-full max-w-lg rounded-[2rem] p-7 sm:p-10"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-[#6e6e73]">
                  Lokalizacje
                </p>
                <h2
                  id="location-modal-title"
                  className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
                >
                  Dodaj lokalizację
                </h2>
              </div>
              <button
                type="button"
                aria-label="Zamknij"
                onClick={onClose}
                className="rounded-full px-3 py-1 text-2xl leading-none text-[#6e6e73] transition hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
              >
                &times;
              </button>
            </div>

            <p className="mt-3 text-[15px] leading-6 text-[#6e6e73]">
              Utwórz miejsce, w którym przechowujesz swoje przedmioty.
            </p>

            {state.id ? (
              <div className="mt-8 space-y-5">
                <p
                  role="status"
                  className="rounded-xl bg-[#effaf3] px-4 py-3 text-sm text-[#18794e]"
                >
                  Lokalizacja została utworzona.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="primary-button"
                  >
                    Zamknij
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onReset}
                  className="secondary-button w-full"
                >
                  Dodaj kolejną lokalizację
                </button>
              </div>
            ) : (
              <form action={formAction} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="location-name" className="field-label">
                    Nazwa lokalizacji
                  </label>
                  <input
                    id="location-name"
                    name="name"
                    type="text"
                    required
                    className="field-input"
                    placeholder="np. Magazyn"
                  />
                </div>

                <div>
                  <label htmlFor="location-parent" className="field-label">
                    Lokalizacja nadrzędna{" "}
                    <span className="text-[#6e6e73]">(opcjonalnie)</span>
                  </label>
                  <select
                    id="location-parent"
                    name="parentId"
                    defaultValue=""
                    className="field-input"
                  >
                    <option value="">Brak — lokalizacja główna</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location-description" className="field-label">
                    Opis <span className="text-[#6e6e73]">(opcjonalnie)</span>
                  </label>
                  <textarea
                    id="location-description"
                    name="description"
                    rows={4}
                    className="field-input resize-none"
                    placeholder="Krótki opis lokalizacji"
                  />
                </div>

                {state.error ? (
                  <p
                    role="alert"
                    className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]"
                  >
                    {state.error}
                  </p>
                ) : null}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="secondary-button"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? "Zapisywanie..." : "Dodaj lokalizację"}
                  </button>
                </div>
              </form>
            )}
          </section>
      </div>
    </>
  );
}
