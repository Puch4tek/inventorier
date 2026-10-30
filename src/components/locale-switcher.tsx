"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocaleAction } from "@/i18n/actions";
import { isLocale, localeNames } from "@/i18n/locale";

export function LocaleSwitcher({ mobile = false }: { mobile?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common.language");
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.currentTarget.value;
    if (!isLocale(nextLocale)) return;

    startTransition(async () => {
      await setLocaleAction(nextLocale);
      window.location.reload();
    });
  }

  return (
    <select
      aria-label={t("label")}
      className={mobile
        ? "field-select m-0 w-full rounded-xl border border-app-border bg-app-surface pl-3 pr-11 py-2 text-[16px] font-medium text-app-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent disabled:cursor-default disabled:opacity-70"
        : "field-select m-0 rounded-xl border border-app-border-strong bg-app-surface pl-4 pr-11 py-2 text-sm font-semibold text-app-foreground shadow-sm transition hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent disabled:cursor-default disabled:opacity-70"}
      disabled={isPending}
      onChange={handleChange}
      value={locale}
    >
      {Object.entries(localeNames).map(([value, name]) => (
        <option key={value} value={value}>{name}</option>
      ))}
    </select>
  );
}
