"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
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
      <Button variant="primary" type="button" onClick={() => setEditOpen(true)} className="px-5 py-3 text-sm">Edytuj</Button>
      <button type="button" onClick={() => setDeleteOpen(true)} className="rounded-xl border border-app-danger/30 px-5 py-3 text-sm font-semibold text-app-danger transition hover:bg-app-danger-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-danger">Usuń</button>
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
      {state.success ? <p className="rounded-xl bg-app-success-surface px-4 py-3 text-sm text-app-success">{state.success}</p> : (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={category.id} />
          <div><label htmlFor="edit-category-name" className="field-label">Nazwa</label><input id="edit-category-name" name="name" defaultValue={category.name} required className="field-input" /></div>
          <div><label htmlFor="edit-category-description" className="field-label">Opis</label><textarea id="edit-category-description" name="description" defaultValue={category.description ?? ""} rows={4} className="field-input resize-none" /></div>
          {state.error ? <p role="alert" className="rounded-xl bg-app-danger-surface px-4 py-3 text-sm text-app-danger">{state.error}</p> : null}
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={onClose} className="px-5 py-3 text-sm">Anuluj</Button><Button variant="primary" type="submit" disabled={isPending} className="px-5 py-3 text-sm disabled:opacity-50">{isPending ? "Zapisywanie..." : "Zapisz zmiany"}</Button></div>
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
      <p className="text-sm leading-6 text-app-muted">Czy na pewno chcesz usunąć kategorię <strong className="text-app-foreground">{category.name}</strong>? Usunięcie jest możliwe tylko bez przypisanych przedmiotów.</p>
      {state.error ? <p role="alert" className="mt-5 rounded-xl bg-app-danger-surface px-4 py-3 text-sm text-app-danger">{state.error}</p> : null}
      <form action={formAction} className="mt-8 flex justify-end gap-3"><input type="hidden" name="id" value={category.id} /><button type="button" onClick={onClose} className="rounded-xl border border-app-border-strong px-5 py-3 text-sm font-semibold transition hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent">Anuluj</button><Button variant="danger" type="submit" disabled={isPending} className="px-5 py-3 text-sm font-semibold transition disabled:opacity-50">{isPending ? "Usuwanie..." : "Usuń kategorię"}</Button></form>
    </Dialog>
  );
}

function Dialog({ title, children, onClose, disabled }: { title: string; children: React.ReactNode; onClose: () => void; disabled: boolean }) {
  return <Modal labelledBy="category-dialog-title" onClose={onClose} disabled={disabled}>
    <section className="w-full max-w-lg rounded-[2rem] bg-app-surface p-7 shadow-modal sm:p-10">
      <div className="flex items-start justify-between gap-6"><h2 id="category-dialog-title" className="text-2xl font-semibold">{title}</h2><button type="button" aria-label="Zamknij" onClick={onClose} disabled={disabled} className="rounded-full px-3 py-1 text-2xl text-app-muted transition hover:bg-app-surface-muted hover:text-app-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent">&times;</button></div>
      <div className="mt-6">{children}</div>
    </section>
  </Modal>;
}

type CategoryActionsProps = Parameters<typeof CategoryActions>[0];
