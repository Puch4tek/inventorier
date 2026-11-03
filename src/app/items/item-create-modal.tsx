"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createItemAction, type CreateItemState } from "./actions";
import { useLocale, useTranslations } from "next-intl";

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
  const locale = useLocale();
  const t = useTranslations("items");
  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <Button
        variant="primary"
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-5 py-3 text-sm"
      >
        {t("create.open")}
      </Button>

      {isOpen ? (
        <ItemCreateDialog
          key={locale}
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
  const t = useTranslations("items");
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
    <Modal labelledBy="item-create-modal-title" onClose={onClose} disabled={isPending}>
      <section
        className="panel-card w-full max-w-lg rounded-4xl p-7 sm:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-app-muted">{t("list.title")}</p>
            <h2
              id="item-create-modal-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
            >
              {t("create.title")}
            </h2>
          </div>
          <button
            type="button"
            aria-label={t("create.close")}
            onClick={onClose}
            disabled={isPending}
            className="rounded-full px-3 py-1 text-2xl leading-none text-app-muted transition hover:bg-app-surface-muted hover:text-app-foreground disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="item-name" className="field-label">
              {t("create.name")}
            </label>
            <input
              id="item-name"
              name="name"
              type="text"
              required
              className="field-input"
              placeholder={t("create.namePlaceholder")}
            />
          </div>

          <div>
            <label htmlFor="item-description" className="field-label">
              {t("create.description")} <span className="text-app-muted">{t("create.optional")}</span>
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
                {t("create.quantity")}
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
                {t("create.unit")}
              </label>
              <input
                id="item-unit"
                name="unit"
                required
                className="field-input"
                placeholder={t("create.unitPlaceholder")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-location" className="field-label">
              {t("create.location")}
            </label>
            <select
              id="item-location"
              name="locationId"
              required
              defaultValue=""
              className="field-input field-select"
            >
              <option value="" disabled>
                {t("create.chooseLocation")}
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
              {t("create.category")}
            </label>
            <select
              id="item-category"
              name="categoryId"
              defaultValue=""
              className="field-input field-select"
            >
              <option value="">{t("create.noCategory")}</option>
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
              className="rounded-xl bg-app-danger-surface px-4 py-3 text-sm text-app-danger"
            >
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p
              role="status"
              className="rounded-xl bg-app-success-surface px-4 py-3 text-sm text-app-success"
            >
              {state.success}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
            >
              {t("create.cancel")}
            </Button>
            <Button variant="primary"
              type="submit"
              disabled={isPending || locations.length === 0}
              className="px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? t("create.saving") : t("create.submit")}
            </Button>
          </div>
        </form>
      </section>
    </Modal>
  );
}
