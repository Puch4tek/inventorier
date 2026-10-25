"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction, updateCategoryAction, type CategoryActionState } from "../actions";

const initialState: CategoryActionState = {};

export function CategoryActions({
  category,
}: {
  category: { id: number; name: string; description: string | null; itemCount: number };
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button type="button" onClick={() => setEditOpen(true)} className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white">Edytuj</button>
      <button type="button" onClick={() => setDeleteOpen(true)} className="rounded-xl border border-[#d92d20]/30 px-5 py-3 text-sm font-semibold text-[#b42318]">Usuń</button>
      {editOpen ? <EditModal category={category} onClose={() => setEditOpen(false)} /> : null}
      {deleteOpen ? <DeleteModal category={category} onClose={() => setDeleteOpen(false)} /> : null}
    </div>
  );
}

function EditModal({ category, onClose }: { category: CategoryActionsProps["category"]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateCategoryAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [router, state.success]);
  return (
    <Dialog title="Edytuj kategorię" onClose={onClose} disabled={isPending}>
      {state.success ? <p className="rounded-xl bg-[#effaf3] px-4 py-3 text-sm text-[#18794e]">{state.success}</p> : (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={category.id} />
          <div><label htmlFor="edit-category-name" className="field-label">Nazwa</label><input id="edit-category-name" name="name" defaultValue={category.name} required className="field-input" /></div>
          <div><label htmlFor="edit-category-description" className="field-label">Opis</label><textarea id="edit-category-description" name="description" defaultValue={category.description ?? ""} rows={4} className="field-input resize-none" /></div>
          {state.error ? <p role="alert" className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">{state.error}</p> : null}
          <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold">Anuluj</button><button type="submit" disabled={isPending} className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{isPending ? "Zapisywanie..." : "Zapisz zmiany"}</button></div>
        </form>
      )}
    </Dialog>
  );
}

function DeleteModal({ category, onClose }: { category: CategoryActionsProps["category"]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(deleteCategoryAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.push("/categories"); }, [router, state.success]);
  return (
    <Dialog title="Usuń kategorię" onClose={onClose} disabled={isPending}>
      <p className="text-sm leading-6 text-[#6e6e73]">Czy na pewno chcesz usunąć kategorię <strong className="text-[#1d1d1f]">{category.name}</strong>? Usunięcie jest możliwe tylko bez przypisanych przedmiotów.</p>
      {state.error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">{state.error}</p> : null}
      <form action={formAction} className="mt-8 flex justify-end gap-3"><input type="hidden" name="id" value={category.id} /><button type="button" onClick={onClose} className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold">Anuluj</button><button type="submit" disabled={isPending} className="rounded-xl bg-[#b42318] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{isPending ? "Usuwanie..." : "Usuń kategorię"}</button></form>
    </Dialog>
  );
}

function Dialog({ title, children, onClose, disabled }: { title: string; children: React.ReactNode; onClose: () => void; disabled: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-8 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !disabled) onClose(); }}>
    <section role="dialog" aria-modal="true" className="w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-10">
      <div className="flex items-start justify-between gap-6"><h2 className="text-2xl font-semibold">{title}</h2><button type="button" aria-label="Zamknij" onClick={onClose} className="text-2xl text-[#6e6e73]">&times;</button></div>
      <div className="mt-6">{children}</div>
    </section>
  </div>;
}

type CategoryActionsProps = Parameters<typeof CategoryActions>[0];
