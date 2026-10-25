"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createItemAction, type CreateItemState } from "./actions";

type Option = {
  id: number;
  name: string;
};

type ItemCreateModalProps = {
  locations: Option[];
  categories: Option[];
};

const initialState: CreateItemState = {};

export function ItemCreateModal({
  locations,
  categories,
}: ItemCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function closeModal() {
    setIsOpen(false);
    setFormKey((key) => key + 1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="primary-button"
      >
        Dodaj przedmiot
      </button>

      {isOpen ? (
        <ItemCreateDialog
          key={formKey}
          locations={locations}
          categories={categories}
          onClose={closeModal}
          onCreated={closeModal}
        />
      ) : null}
    </>
  );
}

function ItemCreateDialog({
  locations,
  categories,
  onClose,
  onCreated,
}: ItemCreateModalProps & {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    createItemAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onCreated();
    }
  }, [onCreated, router, state.success]);

  return (
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
        aria-labelledby="item-create-modal-title"
        className="panel-card max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] p-7 sm:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-[#6e6e73]">Przedmioty</p>
            <h2
              id="item-create-modal-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
            >
              Dodaj przedmiot
            </h2>
          </div>
          <button
            type="button"
            aria-label="Zamknij"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full px-3 py-1 text-2xl leading-none text-[#6e6e73] transition hover:bg-[#f5f5f7] hover:text-[#1d1d1f] disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="item-name" className="field-label">
              Nazwa
            </label>
            <input
              id="item-name"
              name="name"
              type="text"
              required
              className="field-input"
              placeholder="np. Wiertarka"
            />
          </div>

          <div>
            <label htmlFor="item-description" className="field-label">
              Opis <span className="text-[#6e6e73]">(opcjonalnie)</span>
            </label>
            <textarea
              id="item-description"
              name="description"
              rows={3}
              className="field-input resize-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="item-quantity" className="field-label">
                Ilość
              </label>
              <input
                id="item-quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                required
                defaultValue="1"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="item-unit" className="field-label">
                Jednostka
              </label>
              <input
                id="item-unit"
                name="unit"
                required
                className="field-input"
                placeholder="np. szt."
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-location" className="field-label">
              Lokalizacja
            </label>
            <select
              id="item-location"
              name="locationId"
              required
              defaultValue=""
              className="field-input"
            >
              <option value="" disabled>
                Wybierz lokalizację
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-category" className="field-label">
              Kategoria
            </label>
            <select
              id="item-category"
              name="categoryId"
              defaultValue=""
              className="field-input"
            >
              <option value="">Brak kategorii</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]"
            >
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p
              role="status"
              className="rounded-xl bg-[#effaf3] px-4 py-3 text-sm text-[#18794e]"
            >
              {state.success}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="secondary-button disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isPending || locations.length === 0}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Zapisywanie..." : "Dodaj przedmiot"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
