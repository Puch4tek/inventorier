"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
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
      <Button variant="primary"
        type="button"
        onClick={openModal}
        className="px-5 py-3 text-sm font-semibold transition"
      >
        Dodaj lokalizację
      </Button>

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
      <Modal labelledBy="location-modal-title" onClose={onClose} disabled={isPending}>
          <section
            className="panel-card w-full max-w-lg rounded-[2rem] p-7 sm:p-10"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-app-muted">
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
                disabled={isPending}
                className="rounded-full px-3 py-1 text-2xl leading-none text-app-muted transition hover:bg-app-surface-muted hover:text-app-foreground"
              >
                &times;
              </button>
            </div>

            <p className="mt-3 text-[15px] leading-6 text-app-muted">
              Utwórz miejsce, w którym przechowujesz swoje przedmioty.
            </p>

            {state.id ? (
              <div className="mt-8 space-y-5">
                <p
                  role="status"
                  className="rounded-xl bg-app-success-surface px-4 py-3 text-sm text-app-success"
                >
                  Lokalizacja została utworzona.
                </p>
                <div className="flex justify-end">
                  <Button variant="primary"
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="px-5 py-3 text-sm font-semibold transition"
                  >
                    Zamknij
                  </Button>
                </div>
                <Button variant="secondary"
                  type="button"
                  onClick={onReset}
                  className="px-5 py-3 text-sm font-semibold transition w-full"
                >
                  Dodaj kolejną lokalizację
                </Button>
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
                    <span className="text-app-muted">(opcjonalnie)</span>
                  </label>
                  <select
                    id="location-parent"
                    name="parentId"
                    defaultValue=""
                    className="field-input field-select"
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
                    Opis <span className="text-app-muted">(opcjonalnie)</span>
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
                    className="rounded-xl bg-app-danger-surface px-4 py-3 text-sm text-app-danger"
                  >
                    {state.error}
                  </p>
                ) : null}

                <div className="flex justify-end gap-3">
                  <Button variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="px-5 py-3 text-sm font-semibold transition"
                  >
                    Anuluj
                  </Button>
                  <Button variant="primary"
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? "Zapisywanie..." : "Dodaj lokalizację"}
                  </Button>
                </div>
              </form>
            )}
          </section>
      </Modal>
    </>
  );
}
