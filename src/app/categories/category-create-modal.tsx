"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, type CreateCategoryState } from "./actions";
import { useLocale, useTranslations } from "next-intl";

const initialState: CreateCategoryState = {};

export function CategoryCreateModal() {
  const locale = useLocale();
  const t = useTranslations("organization.categories");
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="primary"
        type="button"
        onClick={() => setOpen(true)}
        className="px-5 py-3 text-sm"
      >
        {t("create")}
      </Button>
      {open ? <CategoryDialog key={locale} onClose={close} /> : null}
    </>
  );
}

function CategoryDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("organization.categories");
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
    <Modal labelledBy="category-create-title" onClose={onClose} disabled={isPending}>
      <section
        className="panel-card w-full max-w-lg rounded-[2rem] p-7 shadow-modal sm:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-app-muted">{t("modalKicker")}</p>
            <h2 id="category-create-title" className="mt-2 text-2xl font-semibold">{t("create")}</h2>
          </div>
          <button type="button" aria-label={t("close")} onClick={onClose} disabled={isPending} className="rounded-full px-3 py-1 text-2xl text-app-muted hover:bg-app-surface-muted">
            &times;
          </button>
        </div>
        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="category-name" className="field-label">{t("name")}</label>
            <input id="category-name" name="name" required className="field-input" placeholder={t("exampleName")} />
          </div>
          <div>
            <label htmlFor="category-description" className="field-label">{t("descriptionLabel")} <span className="text-app-muted">{t("optional")}</span></label>
            <textarea id="category-description" name="description" rows={4} className="field-input resize-none" />
          </div>
          {state.error ? <p role="alert" className="status-error">{state.error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending} className="px-5 py-3 text-sm font-semibold transition">{t("cancel")}</Button>
            <Button variant="primary" type="submit" disabled={isPending} className="px-5 py-3 text-sm font-semibold transition disabled:opacity-50">
              {isPending ? t("saving") : t("create")}
            </Button>
          </div>
        </form>
      </section>
    </Modal>
  );
}
