"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteItemAction,
  restoreItemAction,
  updateItemAction,
  type ItemActionState,
} from "../actions";

type Option = {
  id: number;
  name: string;
};

type ItemActionsProps = {
  item: {
    id: number;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    locationId: number;
    categoryId: number | null;
    isArchived: boolean;
  };
  locations: Option[];
  categories: Option[];
};

const initialState: ItemActionState = {};

export function ItemActions({
  item,
  locations,
  categories,
}: ItemActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {item.isArchived ? (
        <button
          type="button"
          onClick={() => setRestoreOpen(true)}
          className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245]"
        >
          Przywróć
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245]"
          >
            Edytuj
          </button>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="rounded-xl border border-[#d92d20]/30 px-5 py-3 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff2f2]"
          >
            Archiwizuj
          </button>
        </>
      )}

      {editOpen ? (
        <EditItemDialog
          item={item}
          locations={locations}
          categories={categories}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
      {archiveOpen ? (
        <ArchiveItemDialog
          item={item}
          onClose={() => setArchiveOpen(false)}
        />
      ) : null}
      {restoreOpen ? (
        <RestoreItemDialog
          item={item}
          onClose={() => setRestoreOpen(false)}
        />
      ) : null}
    </div>
  );
}

function RestoreItemDialog({
  item,
  onClose,
}: {
  item: Pick<ItemActionsProps["item"], "id" | "name">;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    restoreItemAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push(`/items/${item.id}`);
    }
  }, [item.id, router, state.success]);

  return (
    <Dialog title="Przywróć przedmiot" onClose={onClose} disabled={isPending}>
      <p className="text-sm leading-6 text-[#6e6e73]">
        Czy na pewno chcesz przywrócić przedmiot{" "}
        <strong className="text-[#1d1d1f]">{item.name}</strong>? Pojawi się
        ponownie na aktywnej liście.
      </p>
      {state.error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]"
        >
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="mt-8 flex justify-end gap-3">
        <input type="hidden" name="id" value={item.id} />
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold text-[#1d1d1f]"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Przywracanie..." : "Przywróć"}
        </button>
      </form>
    </Dialog>
  );
}

function EditItemDialog({
  item,
  locations,
  categories,
  onClose,
}: ItemActionsProps & { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    updateItemAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <Dialog title="Edytuj przedmiot" onClose={onClose} disabled={isPending}>
      {state.success ? (
        <div className="space-y-5">
          <p className="rounded-xl bg-[#effaf3] px-4 py-3 text-sm text-[#18794e]">
            {state.success}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245]"
          >
            Zamknij
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label htmlFor="edit-item-name" className="field-label">
              Nazwa
            </label>
            <input
              id="edit-item-name"
              name="name"
              defaultValue={item.name}
              required
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="edit-item-description" className="field-label">
              Opis
            </label>
            <textarea
              id="edit-item-description"
              name="description"
              defaultValue={item.description ?? ""}
              rows={3}
              className="field-input resize-none"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-item-quantity" className="field-label">
                Ilość
              </label>
              <input
                id="edit-item-quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                defaultValue={item.quantity}
                required
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="edit-item-unit" className="field-label">
                Jednostka
              </label>
              <input
                id="edit-item-unit"
                name="unit"
                defaultValue={item.unit}
                required
                className="field-input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-item-location" className="field-label">
              Lokalizacja
            </label>
            <select
              id="edit-item-location"
              name="locationId"
              defaultValue={item.locationId}
              required
              className="field-input"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-item-category" className="field-label">
              Kategoria
            </label>
            <select
              id="edit-item-category"
              name="categoryId"
              defaultValue={item.categoryId?.toString() ?? ""}
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
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function ArchiveItemDialog({
  item,
  onClose,
}: {
  item: Pick<ItemActionsProps["item"], "id" | "name">;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteItemAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/items");
    }
  }, [router, state.success]);

  return (
    <Dialog title="Archiwizuj przedmiot" onClose={onClose} disabled={isPending}>
      <p className="text-sm leading-6 text-[#6e6e73]">
        Czy na pewno chcesz zarchiwizować przedmiot{" "}
        <strong className="text-[#1d1d1f]">{item.name}</strong>? Zniknie z
        aktywnej listy przedmiotów, ale historia zostanie zachowana.
      </p>
      {state.error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]"
        >
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="mt-8 flex justify-end gap-3">
        <input type="hidden" name="id" value={item.id} />
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#b42318] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f1d14] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Archiwizowanie..." : "Archiwizuj"}
        </button>
      </form>
    </Dialog>
  );
}

function Dialog({
  title,
  children,
  onClose,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-dialog-title"
        className="max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-black/[0.06] bg-white p-7 text-[#1d1d1f] shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <h2
            id="item-dialog-title"
            className="text-2xl font-semibold tracking-[-0.03em]"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Zamknij"
            onClick={onClose}
            disabled={disabled}
            className="rounded-full px-3 py-1 text-2xl leading-none text-[#6e6e73] transition hover:bg-[#f5f5f7] hover:text-[#1d1d1f] disabled:opacity-50"
          >
            &times;
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
