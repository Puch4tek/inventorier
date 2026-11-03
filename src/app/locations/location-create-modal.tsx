"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  newLocationAction,
  type NewLocationActionState,
} from "./new/actions";
import { useLocale, useTranslations } from "next-intl";

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
  const locale = useLocale();
  const t = useTranslations("organization.locations");
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
        {t("create")}
      </Button>

      {isOpen ? (
        <LocationCreateDialog
          key={`${formKey}-${locale}`}
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
  const t = useTranslations("organization.locations");
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
            className="panel-card w-full max-w-lg rounded-4xl p-7 sm:p-10"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-app-muted">
                  {t("modalKicker")}
                </p>
                <h2
                  id="location-modal-title"
                  className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
                >
                  {t("createTitle")}
                </h2>
              </div>
              <button
                type="button"
                aria-label={t("close")}
                onClick={onClose}
                disabled={isPending}
                className="rounded-full px-3 py-1 text-2xl leading-none text-app-muted transition hover:bg-app-surface-muted hover:text-app-foreground"
              >
                &times;
              </button>
            </div>

            <p className="mt-3 text-[15px] leading-6 text-app-muted">
              {t("createDescription")}
            </p>

            {state.id ? (
              <div className="mt-8 space-y-5">
                <p
                  role="status"
                  className="rounded-xl bg-app-success-surface px-4 py-3 text-sm text-app-success"
                >
                  {t("created")}
                </p>
                <div className="flex justify-end">
                  <Button variant="primary"
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="px-5 py-3 text-sm font-semibold transition"
                  >
                    {t("close")}
                  </Button>
                </div>
                <Button variant="secondary"
                  type="button"
                  onClick={onReset}
                  className="px-5 py-3 text-sm font-semibold transition w-full"
                >
                  {t("createAnother")}
                </Button>
              </div>
            ) : (
              <form action={formAction} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="location-name" className="field-label">
                    {t("name")}
                  </label>
                  <input
                    id="location-name"
                    name="name"
                    type="text"
                    required
                    className="field-input"
                    placeholder={t("exampleName")}
                  />
                </div>

                <div>
                  <label htmlFor="location-parent" className="field-label">
                    {t("parentLabel")}{" "}
                    <span className="text-app-muted">{t("optional")}</span>
                  </label>
                  <select
                    id="location-parent"
                    name="parentId"
                    defaultValue=""
                    className="field-input field-select"
                  >
                    <option value="">{t("noParent")}</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location-description" className="field-label">
                    {t("descriptionLabel")} <span className="text-app-muted">{t("optional")}</span>
                  </label>
                  <textarea
                    id="location-description"
                    name="description"
                    rows={4}
                    className="field-input resize-none"
                    placeholder={t("descriptionPlaceholder")}
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
                    {t("cancel")}
                  </Button>
                  <Button variant="primary"
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? t("saving") : t("create")}
                  </Button>
                </div>
              </form>
            )}
          </section>
      </Modal>
    </>
  );
}
