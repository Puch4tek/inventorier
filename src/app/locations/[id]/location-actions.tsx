"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteLocationAction,
  updateLocationAction,
  type LocationActionState,
} from "./actions";

type LocationOption = {
  id: number;
  name: string;
  parentId: number | null;
};

type LocationActionsProps = {
  location: {
    id: number;
    name: string;
    description: string | null;
    parentId: number | null;
  };
  locations: LocationOption[];
};

const initialState: LocationActionState = {};

export function LocationActions({
  location,
  locations,
}: LocationActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245]"
      >
        Edytuj
      </button>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="rounded-xl border border-[#d92d20]/30 px-5 py-3 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff2f2]"
      >
        Usuń
      </button>

      {editOpen ? (
        <EditLocationModal
          location={location}
          locations={locations}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
      {deleteOpen ? (
        <DeleteLocationModal
          location={location}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </div>
  );
}

function EditLocationModal({
  location,
  locations,
  onClose,
}: LocationActionsProps & { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    updateLocationAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const descendants = getDescendantIds(location.id, locations);
  const parentOptions = locations.filter(
    (option) => option.id !== location.id && !descendants.has(option.id),
  );

  return (
    <Dialog title="Edytuj lokalizację" onClose={onClose} disabled={isPending}>
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
          <input type="hidden" name="id" value={location.id} />
          <div>
            <label htmlFor="edit-location-name" className="field-label">
              Nazwa lokalizacji
            </label>
            <input
              id="edit-location-name"
              name="name"
              defaultValue={location.name}
              required
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="edit-location-description" className="field-label">
              Opis
            </label>
            <textarea
              id="edit-location-description"
              name="description"
              defaultValue={location.description ?? ""}
              rows={4}
              className="field-input resize-none"
            />
          </div>
          <div>
            <label htmlFor="edit-location-parent" className="field-label">
              Lokalizacja nadrzędna
            </label>
            <select
              id="edit-location-parent"
              name="parentId"
              defaultValue={location.parentId?.toString() ?? ""}
              className="field-input"
            >
              <option value="">Brak — lokalizacja główna</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          {state.error ? (
            <p role="alert" className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">
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

function DeleteLocationModal({
  location,
  onClose,
}: {
  location: LocationActionsProps["location"];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteLocationAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/locations");
    }
  }, [router, state.success]);

  return (
    <Dialog title="Usuń lokalizację" onClose={onClose} disabled={isPending}>
      <p className="text-sm leading-6 text-[#6e6e73]">
        Czy na pewno chcesz usunąć lokalizację{" "}
        <strong className="text-[#1d1d1f]">{location.name}</strong>? Operacja
        jest możliwa tylko wtedy, gdy nie ma ona dzieci ani przedmiotów.
      </p>
      {state.error ? (
        <p role="alert" className="mt-5 rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="mt-8 flex justify-end gap-3">
        <input type="hidden" name="id" value={location.id} />
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
          {isPending ? "Usuwanie..." : "Usuń lokalizację"}
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
        aria-labelledby="location-dialog-title"
        className="w-full max-w-lg rounded-[2rem] border border-black/[0.06] bg-white p-7 text-[#1d1d1f] shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <h2 id="location-dialog-title" className="text-2xl font-semibold tracking-[-0.03em]">
            {title}
          </h2>
          <button type="button" aria-label="Zamknij" onClick={onClose} className="text-2xl text-[#6e6e73]">
            &times;
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}

function getDescendantIds(
  locationId: number,
  locations: LocationOption[],
): Set<number> {
  const descendants = new Set<number>();
  let found = true;

  while (found) {
    found = false;
    for (const location of locations) {
      if (
        location.parentId !== null &&
        (location.parentId === locationId || descendants.has(location.parentId)) &&
        !descendants.has(location.id)
      ) {
        descendants.add(location.id);
        found = true;
      }
    }
  }

  return descendants;
}
